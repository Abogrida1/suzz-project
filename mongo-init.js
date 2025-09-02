// MongoDB initialization script
db = db.getSiblingDB('secure-chat-app');

// Create a user for the application
db.createUser({
  user: 'app_user',
  pwd: 'app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'secure-chat-app'
    }
  ]
});

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'email', 'password', 'displayName'],
      properties: {
        username: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 20
        },
        email: {
          bsonType: 'string',
          pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
        },
        displayName: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50
        }
      }
    }
  }
});

db.createCollection('messages', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['sender', 'chatType'],
      properties: {
        chatType: {
          bsonType: 'string',
          enum: ['global', 'private', 'group']
        },
        type: {
          bsonType: 'string',
          enum: ['text', 'image', 'file', 'emoji']
        }
      }
    }
  }
});

db.createCollection('groups');

// Create indexes for better performance
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ isOnline: 1 });

db.messages.createIndex({ chatType: 1, createdAt: -1 });
db.messages.createIndex({ recipients: 1, createdAt: -1 });
db.messages.createIndex({ privateChatWith: 1, createdAt: -1 });
db.messages.createIndex({ sender: 1, createdAt: -1 });

db.groups.createIndex({ createdBy: 1 });
db.groups.createIndex({ 'members.user': 1 });

print('Database initialized successfully!');
