# Cake Delight - Cloud Native Microservices System

**Author**: Pavushetti Ajay Chandra  
**Project**: Capstone Project - Cohort 2

Capstone project for the **Cake Delight** online Cake ordering platform. Built with a decoupled microservices architecture using Node.js, Express Gateway, MongoDB, RabbitMQ for asynchronous event messaging, Docker Compose, and Kubernetes.

---

## System Architecture

The application consists of 6 microservices that communicate via HTTP REST endpoints (routed through Express Gateway) and an asynchronous RabbitMQ message queue for order processing events.

```
                      [ Client Browser ]
                              │
                              ▼
                  [ API Gateway (Port 4000) ]
                              │
  ┌─────────────────┬─────────┴─────────┬──────────────────┐
  │                 │                   │                  │
  ▼                 ▼                   ▼                  ▼
[Frontend]  [Catalog Service]   [Order Service]    [Rating Service]
 (3000)          (4001)              (4002)             (4003)
                                       │
                                       ▼ (AMQP Event)
                             [RabbitMQ Exchange]
                                       │
                                       ▼
                            [Notification Service]
                                    (4004)
```

### Event Flow (Order Completion):

1. User adds items to their shopping basket via the Frontend UI.
2. User completes checkout (`POST /api/orders/checkout`).
3. **Order Service** saves the order to MongoDB and publishes an `ORDER_COMPLETED` event to the `cake_delight_events` exchange in RabbitMQ.
4. **Notification Service** consumes the event from the `notification_order_completed_queue`, creates an in-app notification, and dispatches simulated Email/SMS alerts.

---

## 📦 Services Overview & Port Mapping

| Service                  | Port   | Path Prefix          | Responsibilities                                                                    |
| ------------------------ | ------ | -------------------- | ----------------------------------------------------------------------------------- |
| **Frontend**             | `3000` | `/`                  | Responsive Single-Page Application (SPA) built with HTML5, CSS3, and JavaScript.    |
| **API Gateway**          | `4000` | `/api/*`             | Reverse proxy built with Express Gateway for routing requests to internal services. |
| **Catalog Service**      | `4001` | `/api/cakes`         | Manages cake catalog, categories, search filtering, and price range queries.        |
| **Order Service**        | `4002` | `/api/orders`        | Manages cart basket state, checkout execution, order history, and event publishing. |
| **Rating Service**       | `4003` | `/api/ratings`       | Handles customer star ratings, comments, and cake score summaries.                  |
| **Notification Service** | `4004` | `/api/notifications` | Listens to AMQP order completion events and tracks user notifications.              |

---

## 🔌 API Endpoints Reference

### 1. Catalog Service (`:4001`)

- `GET /api/cakes` - Get all cakes (query params: `category`, `search`, `minPrice`, `maxPrice`)
- `GET /api/cakes/categories` - List available cake categories
- `GET /api/cakes/:id` - Get cake details by ID
- `POST /api/cakes` - Add a new cake to the catalog
- `GET /health` - Health check

### 2. Order Service (`:4002`)

- `GET /api/orders/basket/:userId` - Fetch active basket for a user
- `POST /api/orders/basket/:userId` - Add or update item quantity in basket
- `PUT /api/orders/basket/:userId/item` - Set exact item quantity
- `DELETE /api/orders/basket/:userId/item/:cakeId` - Remove specific item from basket
- `DELETE /api/orders/basket/:userId` - Clear user basket
- `POST /api/orders/checkout` - Checkout basket & trigger `ORDER_COMPLETED` AMQP event
- `GET /api/orders/user/:userId` - Get order history for a user
- `GET /api/orders/:id` - Get specific order by ID
- `GET /api/orders` - List all orders
- `GET /health` - Health check

### 3. Rating Service (`:4003`)

- `POST /api/ratings` - Submit product review & rating
- `GET /api/ratings` - Get all submitted ratings
- `GET /api/ratings/cake/:cakeId` - Get reviews for a specific cake
- `GET /api/ratings/cake/:cakeId/summary` - Get average score & review count for a cake
- `GET /api/ratings/summaries` - Get bulk ratings map for all products
- `GET /health` - Health check

### 4. Notification Service (`:4004`)

- `GET /api/notifications` - List all system notifications
- `GET /api/notifications/user/:userId` - List notifications for a specific user
- `POST /api/notifications/event` - Direct webhook endpoint for order notifications
- `PUT /api/notifications/:id/read` - Mark single notification as read
- `PUT /api/notifications/user/:userId/read-all` - Mark all notifications read for user
- `GET /health` - Health check

### 5. API Gateway (`:4000`)

- Proxies incoming browser requests on port `4000` to the corresponding service containers:
  - `/` ➡️ `http://frontend:3000`
  - `/api/cakes*` ➡️ `http://catalog-service:4001`
  - `/api/orders*` ➡️ `http://order-service:4002`
  - `/api/ratings*` ➡️ `http://rating-service:4003`
  - `/api/notifications*` ➡️ `http://notification-service:4004`

---

## 🚀 Running the Project

### Option A: Using Docker Compose (Recommended)

Ensure Docker Desktop is running, then start all containers:

```bash
docker compose up --build -d
```

Once running, access the web application at:

- **Frontend App**: `http://localhost:3000` (or via Gateway at `http://localhost:4000`)
- **API Gateway**: `http://localhost:4000`

To stop all containers:

```bash
docker compose down
```

---

### Option B: Deploying to Kubernetes (Minikube)

Kubernetes deployment manifests are located in the `k8s/` directory.

1. **Start Minikube Cluster**:
   ```bash
   minikube start
   ```

2. **Build / Load Images into Minikube**:
   Build the microservice images directly inside Minikube's container store:
   ```bash
   minikube image build -t capstone-catalog-service:latest ./services/catalog-service
   minikube image build -t capstone-order-service:latest ./services/order-service
   minikube image build -t capstone-rating-service:latest ./services/rating-service
   minikube image build -t capstone-notification-service:latest ./services/notification-service
   minikube image build -t capstone-api-gateway:latest ./services/api-gateway
   minikube image build -t capstone-frontend:latest ./services/frontend
   ```

3. **Apply Kubernetes Manifests & Secrets**:
   ```bash
   kubectl apply -f k8s/
   ```

4. **Verify Pod & Service Status**:
   ```bash
   kubectl get pods
   kubectl get svc
   ```
   *(Ensure all pods transition to `1/1 Running` status)*

5. **Access Frontend Application**:
   Run the following command to get the live website URL:
   ```bash
   minikube service frontend --url
   ```
   Open the returned URL (e.g. `http://127.0.0.1:49294`) in your browser to access the **Cake Delight** store!

6. **Exposing API Gateway & Hitting Endpoints (`/api/orders`, `/api/cakes`, etc.)**:

   - **Expose API Gateway on Port 4000 (Recommended)**:
     Run port-forwarding to bind the Kubernetes API Gateway directly to `localhost:4000`:
     ```bash
     kubectl port-forward svc/api-gateway 4000:4000
     ```
     Now you can access all API endpoints directly in your browser or Postman:
     - **Orders Endpoint**: `http://localhost:4000/api/orders`
     - **Ratings Endpoint**: `http://localhost:4000/api/ratings`
     - **Catalog Endpoint**: `http://localhost:4000/api/cakes`
     - **Notifications Endpoint**: `http://localhost:4000/api/notifications`

   - **Via Minikube Service URL**:
     Alternatively, get the dynamic Minikube URL for API Gateway:
     ```bash
     minikube service api-gateway --url
     ```
     Hit separate endpoints through the returned Gateway URL:
     - `http://<GATEWAY-URL>/api/orders`
     - `http://<GATEWAY-URL>/api/cakes`
     - `http://<GATEWAY-URL>/api/ratings`
     - `http://<GATEWAY-URL>/api/notifications`

   - **Direct Service Port Forwarding**:
     To access an individual microservice directly on its native port (e.g. Order Service on `4002`):
     ```bash
     kubectl port-forward svc/order-service 4002:4002
     ```
     Now hit `http://localhost:4002/api/orders` directly.

7. **Clean Up / Stop Cluster**:
   ```bash
   kubectl delete -f k8s/
   minikube stop
   ```

---

### Option C: Running Locally (Development Mode)

If running without Docker:

1. Install dependencies for all services:

   ```bash
   npm run install:all
   ```

2. Configure environment variables in `.env`:

   ```env
   PORT=4000
   CATALOG_SERVICE_PORT=4001
   ORDER_SERVICE_PORT=4002
   RATING_SERVICE_PORT=4003
   NOTIFICATION_SERVICE_PORT=4004
   MONGO_URI=mongodb://localhost:27017/cake_delight
   RABBITMQ_URL=amqps://<your-rabbitmq-url>
   ```

3. Start each service (in separate terminal tabs):
   ```bash
   npm run start:catalog
   npm run start:order
   npm run start:rating
   npm run start:notification
   npm run start:gateway
   npm run start:frontend
   ```

---

## 🛠️ Tech Stack & Dependencies

- **Backend Runtime**: Node.js, Express.js
- **API Gateway**: Express Gateway
- **Messaging**: CloudAMQP / RabbitMQ (`amqplib`)
- **Database**: MongoDB & Mongoose ORM
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Containerization & Orchestration**: Docker, Docker Compose, Kubernetes manifests

---

## 👤 Author

**Pavushetti Ajay Chandra**  
_Capstone Project - Cohort 2_
