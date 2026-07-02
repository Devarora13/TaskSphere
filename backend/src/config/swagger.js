const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Secure Task Management System API',
      version: '1.0.0',
      description: 'REST API documentation for the Task Management System with Role-Based Access Control and JWT Auth.',
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Input your JWT access token. Header format: "Authorization: Bearer <token>"',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-02T10:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-07-02T10:00:00.000Z' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'Complete Assignment' },
            description: { type: 'string', example: 'Build and test Express API' },
            status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE'], example: 'TODO' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], example: 'MEDIUM' },
            dueDate: { type: 'string', format: 'date-time', example: '2026-07-05T00:00:00.000Z', nullable: true },
            ownerId: { type: 'integer', example: 1 },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-02T10:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-07-02T10:00:00.000Z' },
          },
        },
      },
    },
    paths: {
      '/auth/register': {
        post: {
          summary: 'Register a new user',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', example: 'John Doe' },
                    email: { type: 'string', example: 'john@example.com' },
                    password: { type: 'string', example: 'password123' },
                    role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'User registered successfully. HTTP-only refresh token set in cookies.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Registration successful.' },
                      accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsIn...' },
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            400: { description: 'Validation failed or email already in use.' },
          },
        },
      },
      '/auth/login': {
        post: {
          summary: 'Log in an existing user',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'john@example.com' },
                    password: { type: 'string', example: 'password123' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful. HTTP-only refresh token set in cookies.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Login successful.' },
                      accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsIn...' },
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            401: { description: 'Incorrect email or password.' },
          },
        },
      },
      '/auth/refresh': {
        post: {
          summary: 'Refresh access token',
          tags: ['Authentication'],
          description: 'Requires the HTTP-only refresh token cookie to be attached.',
          responses: {
            200: {
              description: 'Access token refreshed successfully. New HTTP-only refresh token set in cookies.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsIn...' },
                    },
                  },
                },
              },
            },
            401: { description: 'Invalid or expired refresh token.' },
          },
        },
      },
      '/auth/logout': {
        post: {
          summary: 'Log out a user',
          tags: ['Authentication'],
          description: 'Clears the refresh token cookie and deletes it from database.',
          responses: {
            200: {
              description: 'Logged out successfully.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Logged out successfully.' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/auth/me': {
        get: {
          summary: 'Get current logged in user details',
          tags: ['Authentication'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Current user profile.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized.' },
          },
        },
      },
      '/tasks': {
        get: {
          summary: 'Get all tasks of current user (with search, filter, sort, pagination)',
          tags: ['Tasks'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search term in title or description' },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE'] }, description: 'Filter tasks by status' },
            { name: 'priority', in: 'query', schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] }, description: 'Filter tasks by priority' },
            { name: 'sortBy', in: 'query', schema: { type: 'string', example: 'dueDate:asc' }, description: 'Sort by field:order (e.g. createdAt:desc, dueDate:asc)' },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 }, description: 'Items per page' },
          ],
          responses: {
            200: {
              description: 'List of tasks and pagination metadata.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      tasks: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Task' },
                      },
                      meta: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer', example: 15 },
                          page: { type: 'integer', example: 1 },
                          limit: { type: 'integer', example: 10 },
                          totalPages: { type: 'integer', example: 2 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create a new task',
          tags: ['Tasks'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: { type: 'string', example: 'Fix critical bug' },
                    description: { type: 'string', example: 'Fix authentication cookie flag bug' },
                    status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE'], example: 'TODO' },
                    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], example: 'HIGH' },
                    dueDate: { type: 'string', format: 'date-time', example: '2026-07-10T12:00:00.000Z' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Task created successfully.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Task created successfully.' },
                      task: { $ref: '#/components/schemas/Task' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/tasks/{id}': {
        get: {
          summary: 'Get a task by ID',
          tags: ['Tasks'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Task ID' },
          ],
          responses: {
            200: {
              description: 'Task details.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      task: { $ref: '#/components/schemas/Task' },
                    },
                  },
                },
              },
            },
            403: { description: 'You are not authorized to access this task.' },
            404: { description: 'Task not found.' },
          },
        },
        put: {
          summary: 'Update a task',
          tags: ['Tasks'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Task ID' },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', example: 'Updated title' },
                    description: { type: 'string', example: 'Updated description' },
                    status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE'] },
                    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
                    dueDate: { type: 'string', format: 'date-time', nullable: true },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Task updated successfully.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Task updated successfully.' },
                      task: { $ref: '#/components/schemas/Task' },
                    },
                  },
                },
              },
            },
          },
        },
        delete: {
          summary: 'Delete a task',
          tags: ['Tasks'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Task ID' },
          ],
          responses: {
            200: {
              description: 'Task deleted successfully.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Task deleted successfully.' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/admin/users': {
        get: {
          summary: 'Get all users with their task counts (ADMIN only)',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'List of all users.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      users: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer', example: 2 },
                            name: { type: 'string', example: 'Jane Doe' },
                            email: { type: 'string', example: 'jane@example.com' },
                            role: { type: 'string', example: 'USER' },
                            createdAt: { type: 'string', format: 'date-time' },
                            _count: {
                              type: 'object',
                              properties: {
                                tasks: { type: 'integer', example: 5 },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/admin/tasks': {
        get: {
          summary: 'Get all tasks across all users (ADMIN only)',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE'] } },
            { name: 'priority', in: 'query', schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] } },
            { name: 'sortBy', in: 'query', schema: { type: 'string', example: 'ownerId:asc' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          ],
          responses: {
            200: {
              description: 'List of tasks from all users.',
            },
          },
        },
      },
      '/admin/users/{id}': {
        delete: {
          summary: 'Delete a user and purge their tasks (ADMIN only)',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'User ID to delete' },
          ],
          responses: {
            200: {
              description: 'User deleted successfully.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'User and all associated tasks deleted successfully.' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
