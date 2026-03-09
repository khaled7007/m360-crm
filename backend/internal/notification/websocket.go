package notification

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/CamelLabSA/M360/backend/internal/auth"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins; tighten in production via CORS config
	},
}

// Hub manages WebSocket connections per user.
type Hub struct {
	mu      sync.RWMutex
	clients map[uuid.UUID]map[*websocket.Conn]struct{}
}

// NewHub creates a new WebSocket hub.
func NewHub() *Hub {
	return &Hub{
		clients: make(map[uuid.UUID]map[*websocket.Conn]struct{}),
	}
}

// Register adds a connection for a user.
func (h *Hub) Register(userID uuid.UUID, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.clients[userID] == nil {
		h.clients[userID] = make(map[*websocket.Conn]struct{})
	}
	h.clients[userID][conn] = struct{}{}
}

// Unregister removes a connection for a user.
func (h *Hub) Unregister(userID uuid.UUID, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if conns, ok := h.clients[userID]; ok {
		delete(conns, conn)
		if len(conns) == 0 {
			delete(h.clients, userID)
		}
	}
}

// Broadcast sends a JSON message to all connections for the given user.
func (h *Hub) Broadcast(userID uuid.UUID, message interface{}) {
	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("ws: failed to marshal message: %v", err)
		return
	}

	h.mu.RLock()
	conns := h.clients[userID]
	// Copy to avoid holding the lock while writing
	targets := make([]*websocket.Conn, 0, len(conns))
	for conn := range conns {
		targets = append(targets, conn)
	}
	h.mu.RUnlock()

	for _, conn := range targets {
		if err := conn.SetWriteDeadline(time.Now().Add(writeWait)); err != nil {
			log.Printf("ws: set write deadline: %v", err)
			continue
		}
		if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Printf("ws: write error: %v", err)
			h.Unregister(userID, conn)
			conn.Close()
		}
	}
}

// Notify pushes a notification to a user via WebSocket if they are connected.
// This is meant to be called by the notification service after persisting a notification.
func (h *Hub) Notify(userID uuid.UUID, notif *Notification) {
	h.Broadcast(userID, map[string]interface{}{
		"type":         "notification",
		"notification": notif,
	})
}

// WebSocket upgrades an HTTP connection to WebSocket for real-time notifications.
// Authenticates via the "token" query parameter.
func (h *Handler) WebSocket(c echo.Context) error {
	tokenStr := c.QueryParam("token")
	if tokenStr == "" {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "missing token query parameter"})
	}

	claims, err := h.authService.ParseToken(tokenStr)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "invalid token"})
	}

	conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		log.Printf("ws: upgrade failed: %v", err)
		return err
	}

	userID := claims.UserID
	h.hub.Register(userID, conn)
	log.Printf("ws: client connected user=%s", userID)

	defer func() {
		h.hub.Unregister(userID, conn)
		conn.Close()
		log.Printf("ws: client disconnected user=%s", userID)
	}()

	// Configure read side for pong handling
	conn.SetReadLimit(maxMessageSize)
	if err := conn.SetReadDeadline(time.Now().Add(pongWait)); err != nil {
		return err
	}
	conn.SetPongHandler(func(string) error {
		return conn.SetReadDeadline(time.Now().Add(pongWait))
	})

	// Start ping ticker in a goroutine
	done := make(chan struct{})
	go func() {
		ticker := time.NewTicker(pingPeriod)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				if err := conn.SetWriteDeadline(time.Now().Add(writeWait)); err != nil {
					return
				}
				if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
					return
				}
			case <-done:
				return
			}
		}
	}()

	// Read loop — keeps connection alive, discards client messages
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("ws: unexpected close: %v", err)
			}
			break
		}
	}

	close(done)
	return nil
}

// SetHub sets the WebSocket hub on the handler. Must be called before WebSocket route is used.
func (h *Handler) SetHub(hub *Hub, authSvc *auth.Service) {
	h.hub = hub
	h.authService = authSvc
}
