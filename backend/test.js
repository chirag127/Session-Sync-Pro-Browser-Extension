const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Session = require('./models/Session');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/session-sync-pro-test')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Test user creation
async function testUserCreation() {
  try {
    // Delete existing test user if it exists
    await User.deleteOne({ email: 'test@example.com' });
    
    // Create a new user
    const user = new User({
      email: 'test@example.com',
      password: 'password123'
    });
    
    await user.save();
    console.log('User created successfully:', user);
    
    // Test password hashing
    const isMatch = await user.comparePassword('password123');
    console.log('Password match:', isMatch);
    
    return user;
  } catch (error) {
    console.error('Error testing user creation:', error);
  }
}

// Test session creation
async function testSessionCreation(userId) {
  try {
    // Create a new session
    const session = new Session({
      user: userId,
      name: 'Test Session',
      domain: 'example.com',
      cookies: [
        {
          name: 'session_id',
          value: '123456',
          domain: 'example.com',
          path: '/',
          secure: true,
          httpOnly: true,
          expirationDate: Date.now() + 86400000
        }
      ],
      localStorage: {
        'token': 'jwt_token_123',
        'user': '{"id":1,"name":"Test User"}'
      },
      sessionStorage: {
        'temp_data': 'some_value'
      },
      hasHttpOnlyCookies: true
    });
    
    await session.save();
    console.log('Session created successfully:', session);
    
    // Test session retrieval
    const sessions = await Session.find({ user: userId });
    console.log('Sessions for user:', sessions);
    
    return session;
  } catch (error) {
    console.error('Error testing session creation:', error);
  }
}

// Run tests
async function runTests() {
  try {
    const user = await testUserCreation();
    if (user) {
      await testSessionCreation(user._id);
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Tests completed');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

runTests();
