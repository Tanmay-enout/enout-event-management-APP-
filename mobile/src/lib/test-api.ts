// Simple API test utility
import { httpClient } from './http';
import { API_ENDPOINTS } from './config';

export async function testApiConnection() {
  console.log('Testing API connection...');
  
  try {
    // Test health endpoint
    const healthResponse = await httpClient.get(API_ENDPOINTS.HEALTH.CHECK);
    console.log('Health check:', healthResponse.ok ? '✅ PASS' : '❌ FAIL');
    
    // Test events endpoint
    const eventsResponse = await httpClient.get(API_ENDPOINTS.EVENTS.LIST);
    console.log('Events endpoint:', eventsResponse.ok ? '✅ PASS' : '❌ FAIL');
    
    if (eventsResponse.ok && eventsResponse.data) {
      console.log('Events found:', Array.isArray(eventsResponse.data) ? eventsResponse.data.length : 'Unknown format');
    }
    
    // Test mobile messages endpoint (with default event)
    const messagesResponse = await httpClient.get(API_ENDPOINTS.MOBILE.MESSAGES('event-1'));
    console.log('Mobile messages endpoint:', messagesResponse.ok ? '✅ PASS' : '❌ FAIL');
    
    return {
      health: healthResponse.ok,
      events: eventsResponse.ok,
      messages: messagesResponse.ok,
    };
  } catch (error) {
    console.error('API test failed:', error);
    return {
      health: false,
      events: false,
      messages: false,
    };
  }
}
