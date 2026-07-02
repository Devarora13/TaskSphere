# Scalability and Architecture Report

This document outlines structural strategies for scaling the **TaskSphere** application to support high concurrent throughput, millions of tasks, and modern high-availability SLAs.

---

## 1. Caching Layer (Redis)
To alleviate database load and decrease API response latency for repeated queries, we propose introducing a Redis caching layer.

* **Task Caching**:
  * Store serializations of user task results (e.g. key: `user:{userId}:tasks:page:{page}:query:{hash}`).
  * Set a short-lived Time-To-Live (TTL) of 5–10 minutes.
  * **Cache Invalidation**: On task write operations (`POST`, `PUT`, `DELETE` routes), actively purge the cached patterns starting with `user:{userId}:tasks:*` to guarantee consistency.
* **Session Cache (Optional alternative to DB Tokens)**:
  * Cache refresh token lookup objects directly in Redis for fast authentication checks instead of hitting PostgreSQL.

---

## 2. Database Optimization
As task volumes grow, database operations become the primary bottleneck.

* **Database Indexing**:
  * We have pre-optimized the schema in `schema.prisma` by including index mappings (`@@index([ownerId])`, `@@index([status])`, `@@index([priority])`). This accelerates partial matching, sorting by priorities, and scoping queries per owner.
* **Connection Pooling**:
  * PostgreSQL processes connections as separate OS processes, which is resource-intensive.
  * Prisma's engine features built-in connection pooling (`?connection_limit=10` query parameter). For production systems with dozens of containerized instances, a proxy tool like **PgBouncer** is recommended to multiplex pool requests.
* **Read-Write Splitting**:
  * Provision a read-replica database cluster. Direct write/delete calls to the Primary DB, and routes like `GET /tasks` or global dashboard audits to the Read-Replicas.

---

## 3. High Availability and Load Balancing (Stateless Scaling)
Since the API server does not retain in-memory user sessions (using stateless JWT tokens and retrieving refresh tokens from centralized storage), the Express service can scale horizontally.

* **NGINX / AWS ALB**: Place a load balancer in front of the API nodes. Configure round-robin or least-connections distribution.
* **Health Check Endpoints**: Utilize the `/api/health` path to monitor instance integrity and automate routing dropouts if a service crashes.
* **Process Management**: Run server nodes under process managers like **PM2** (with cluster mode enabled) inside virtual machines to utilize multi-core server processors.

---

## 4. Transition to Microservices
If development velocity or service loading diverges (e.g., intensive audit calculations vs. lightweight task status toggles), the system can split into microservices:

```
                    [ API Gateway (Reverse Proxy) ]
                      /                         \
                     /                           \
         [ Authentication Service ]       [ Task CRUD Service ]
             (User DB / Tokens)             (Task DB / Indexes)
```

* **API Gateway**: Handles rate-limiting, CORS validation, and routes requests to corresponding services.
* **Message Brokers**: Introduce **RabbitMQ** or **Apache Kafka** for asynchronous operations (e.g. sending signup verification emails, generating task audit analytics reports).
