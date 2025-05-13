const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DYNAMODB_TABLE || 'WildRydes';

// Serve the static files
app.use(express.static('public'));

// API endpoint to request a ride
app.post('/api/ride', async (req, res) => {
  try {
    const { pickupLocation } = req.body;
    
    if (!pickupLocation) {
      return res.status(400).json({ error: 'Pickup location is required' });
    }
    
    const rideId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const params = {
      TableName: tableName,
      Item: {
        RideId: rideId,
        User: 'default-user', // In a real app, this would come from authentication
        PickupLocation: pickupLocation,
        RequestTime: timestamp,
        Status: 'REQUESTED'
      }
    };
    
    await dynamoDB.put(params).promise();
    
    // Simulate assignment of a unicorn
    const unicorn = {
      Name: ['Bucephalus', 'Shadowfox', 'Rocinante'][Math.floor(Math.random() * 3)],
      Color: ['Golden', 'Brown', 'Yellow'][Math.floor(Math.random() * 3)],
      Gender: ['Male', 'Female'][Math.floor(Math.random() * 2)]
    };
    
    // Update the ride with the assigned unicorn
    const updateParams = {
      TableName: tableName,
      Key: { RideId: rideId },
      UpdateExpression: 'set #s = :s, Unicorn = :u',
      ExpressionAttributeNames: {
        '#s': 'Status'
      },
      ExpressionAttributeValues: {
        ':s': 'ASSIGNED',
        ':u': unicorn
      }
    };
    
    await dynamoDB.update(updateParams).promise();
    
    res.json({
      RideId: rideId,
      Unicorn: unicorn,
      UnicornETA: '30 seconds'
    });
  } catch (error) {
    console.error('Error requesting ride:', error);
    res.status(500).json({ error: 'Failed to request ride' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
