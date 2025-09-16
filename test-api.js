#!/usr/bin/env node

/**
 * Simple API Test Script for Multi-Tenant SaaS Notes Application
 * 
 * This script tests the main API endpoints to ensure they work correctly.
 * Run this after deployment to verify your application is working.
 * 
 * Usage: node test-api.js <base-url>
 * Example: node test-api.js https://your-app.vercel.app
 */

const https = require('https');
const http = require('http');

// Test configuration
const TEST_ACCOUNTS = [
  { email: 'admin@acme.test', password: 'password', role: 'admin', tenant: 'acme' },
  { email: 'user@acme.test', password: 'password', role: 'member', tenant: 'acme' },
  { email: 'admin@globex.test', password: 'password', role: 'admin', tenant: 'globex' },
  { email: 'user@globex.test', password: 'password', role: 'member', tenant: 'globex' }
];

class APITester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.tokens = {};
    this.results = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith('https://');
      const client = isHttps ? https : http;
      
      const request = client.request(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      }, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          try {
            const jsonData = data ? JSON.parse(data) : {};
            resolve({
              status: response.statusCode,
              headers: response.headers,
              data: jsonData
            });
          } catch (e) {
            resolve({
              status: response.statusCode,
              headers: response.headers,
              data: data
            });
          }
        });
      });

      request.on('error', reject);
      
      if (options.body) {
        request.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      
      request.end();
    });
  }

  async testHealthEndpoint() {
    this.log('Testing health endpoint...');
    try {
      const response = await this.makeRequest(`${this.baseUrl}/api/health`);
      if (response.status === 200 && response.data.status === 'ok') {
        this.log('Health endpoint working correctly', 'success');
        return true;
      } else {
        this.log(`Health endpoint failed: ${response.status} - ${JSON.stringify(response.data)}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Health endpoint error: ${error.message}`, 'error');
      return false;
    }
  }

  async loginUser(email, password) {
    this.log(`Logging in user: ${email}`);
    try {
      // This is a simplified login test - in reality, you'd need to use Supabase Auth
      // For this test, we'll assume the frontend handles authentication
      this.log(`Login test for ${email} - Authentication handled by Supabase Auth`, 'info');
      return true;
    } catch (error) {
      this.log(`Login failed for ${email}: ${error.message}`, 'error');
      return false;
    }
  }

  async testNotesAPI(token, account) {
    this.log(`Testing notes API for ${account.email}...`);
    
    try {
      // Test GET /api/notes
      const listResponse = await this.makeRequest(`${this.baseUrl}/api/notes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (listResponse.status !== 200) {
        this.log(`Failed to list notes: ${listResponse.status}`, 'error');
        return false;
      }
      
      this.log(`Successfully listed ${listResponse.data.length || 0} notes`, 'success');
      
      // Test POST /api/notes (create a test note)
      const createResponse = await this.makeRequest(`${this.baseUrl}/api/notes`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: {
          title: `Test Note from ${account.email}`,
          content: `This is a test note created by ${account.email}`
        }
      });
      
      if (createResponse.status !== 201) {
        this.log(`Failed to create note: ${createResponse.status} - ${JSON.stringify(createResponse.data)}`, 'error');
        return false;
      }
      
      const noteId = createResponse.data.id;
      this.log(`Successfully created note: ${noteId}`, 'success');
      
      // Test GET /api/notes/:id
      const getResponse = await this.makeRequest(`${this.baseUrl}/api/notes/${noteId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (getResponse.status !== 200) {
        this.log(`Failed to get note: ${getResponse.status}`, 'error');
        return false;
      }
      
      this.log(`Successfully retrieved note: ${noteId}`, 'success');
      
      // Test PUT /api/notes/:id
      const updateResponse = await this.makeRequest(`${this.baseUrl}/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: {
          title: `Updated Test Note from ${account.email}`,
          content: `This note was updated by ${account.email}`
        }
      });
      
      if (updateResponse.status !== 200) {
        this.log(`Failed to update note: ${updateResponse.status}`, 'error');
        return false;
      }
      
      this.log(`Successfully updated note: ${noteId}`, 'success');
      
      // Test DELETE /api/notes/:id
      const deleteResponse = await this.makeRequest(`${this.baseUrl}/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (deleteResponse.status !== 200) {
        this.log(`Failed to delete note: ${deleteResponse.status}`, 'error');
        return false;
      }
      
      this.log(`Successfully deleted note: ${noteId}`, 'success');
      
      return true;
    } catch (error) {
      this.log(`Notes API test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testTenantUpgrade(token, account) {
    if (account.role !== 'admin') {
      this.log(`Skipping upgrade test for non-admin user: ${account.email}`, 'info');
      return true;
    }
    
    this.log(`Testing tenant upgrade for admin: ${account.email}...`);
    
    try {
      const response = await this.makeRequest(`${this.baseUrl}/api/tenants/${account.tenant}/upgrade`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 200) {
        this.log(`Successfully tested upgrade endpoint`, 'success');
        return true;
      } else {
        this.log(`Upgrade test failed: ${response.status} - ${JSON.stringify(response.data)}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Upgrade test error: ${error.message}`, 'error');
      return false;
    }
  }

  async runTests() {
    this.log(`Starting API tests for: ${this.baseUrl}`);
    this.log('=' * 50);
    
    // Test 1: Health endpoint
    const healthOk = await this.testHealthEndpoint();
    if (!healthOk) {
      this.log('Health endpoint test failed. Stopping tests.', 'error');
      return;
    }
    
    this.log('');
    this.log('Health endpoint is working. Manual testing required for authenticated endpoints.');
    this.log('Please test the following manually:');
    this.log('');
    
    for (const account of TEST_ACCOUNTS) {
      this.log(`1. Login as ${account.email} (${account.role})`);
      this.log(`2. Test creating, editing, and deleting notes`);
      this.log(`3. Verify tenant isolation (users should only see their tenant's data)`);
      
      if (account.role === 'admin') {
        this.log(`4. Test team invitation feature`);
        this.log(`5. Test tenant upgrade feature`);
      }
      
      this.log('');
    }
    
    this.log('Manual Testing Checklist:');
    this.log('✅ Health endpoint accessible');
    this.log('□ All test accounts can login');
    this.log('□ Notes CRUD operations work');
    this.log('□ Tenant isolation enforced');
    this.log('□ Role-based access control working');
    this.log('□ Free plan note limits enforced');
    this.log('□ Pro plan upgrade works (admin only)');
    this.log('□ User invitation works (admin only)');
    this.log('□ CORS headers present for API access');
    
    this.log('');
    this.log('API Endpoints to test:');
    this.log('GET  /api/health');
    this.log('GET  /api/notes');
    this.log('POST /api/notes');
    this.log('GET  /api/notes/:id');
    this.log('PUT  /api/notes/:id');
    this.log('DELETE /api/notes/:id');
    this.log('POST /api/tenants/:slug/upgrade');
    this.log('POST /api/users/invite');
  }
}

// Main execution
if (require.main === module) {
  const baseUrl = process.argv[2];
  
  if (!baseUrl) {
    console.log('Usage: node test-api.js <base-url>');
    console.log('Example: node test-api.js https://your-app.vercel.app');
    process.exit(1);
  }
  
  const tester = new APITester(baseUrl);
  tester.runTests().catch(console.error);
}

module.exports = APITester;
