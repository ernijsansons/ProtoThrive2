/**
 * Artillery Processor Functions
 * Custom functions for load testing scenarios
 */

module.exports = {
  // Generate random string for unique emails
  $randomString: function(context, events, done) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    context.vars.randomString = result;
    return done();
  },

  // Generate random number
  $randomNumber: function(context, events, done) {
    context.vars.randomNumber = Math.floor(Math.random() * 10000);
    return done();
  },

  // Before scenario: Set up test data
  beforeScenario: function(context, ee, next) {
    // Add timestamp to context
    context.vars.timestamp = Date.now();

    // Generate unique test email
    context.vars.testEmail = `loadtest-${Date.now()}@protothrive.com`;

    return next();
  },

  // After scenario: Clean up
  afterScenario: function(context, ee, next) {
    // Log scenario completion
    if (context.vars.roadmapId) {
      console.log(`Scenario completed. Roadmap ID: ${context.vars.roadmapId}`);
    }

    return next();
  },

  // Custom function to validate response
  validateResponse: function(context, next) {
    const response = context.vars.response;

    if (!response) {
      return next(new Error('No response received'));
    }

    // Check for required fields
    if (response.statusCode === 200 || response.statusCode === 201) {
      if (!response.body) {
        return next(new Error('Response body is empty'));
      }
    }

    return next();
  },

  // Function to handle authentication
  authenticate: function(context, events, done) {
    const fetch = require('node-fetch');

    fetch(`${context.target}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: context.vars.email || 'test@protothrive.com',
        password: context.vars.password || 'TestPassword123!'
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.token) {
        context.vars.authToken = data.token;
        context.vars.userId = data.user.id;
      }
      return done();
    })
    .catch(err => {
      console.error('Authentication failed:', err);
      return done(err);
    });
  }
};