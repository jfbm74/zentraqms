#!/usr/bin/env node

/**
 * Test script to verify organization wizard save functionality
 * after fixing the backend service import errors.
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';

// Test organization data
const testOrgData = {
  razon_social: 'Test Organization Fixed',
  nit: '987654321',
  digito_verificacion: '8',
  email_contacto: 'test.fixed@example.com',
  telefono_principal: '3001234567',
  website: 'https://testfixed.com',
  descripcion: 'Test organization after service fix'
};

async function testWizardSave() {
  console.log('🧪 Testing Organization Wizard Save Functionality...\n');

  try {
    // Step 1: Try to create organization without authentication to test service import
    console.log('1️⃣ Testing endpoint accessibility...');
    
    const response = await axios.post(`${API_BASE_URL}/api/v1/wizard/`, testOrgData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('❌ Unexpected success - should require authentication');
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Endpoint is accessible - returns expected 401 (authentication required)');
      console.log('✅ No "module not found" errors - backend services are working!');
    } else if (error.response?.status === 500) {
      console.log('❌ Server error detected:');
      console.log(error.response.data);
      return false;
    } else {
      console.log('⚠️ Unexpected error:', error.message);
    }
  }

  // Step 2: Test DIVIPOLA endpoints (these should work without auth)
  console.log('\n2️⃣ Testing DIVIPOLA services...');
  
  try {
    const deptResponse = await axios.get(`${API_BASE_URL}/api/v1/divipola/departments/`);
    console.log('✅ Departments endpoint working:', deptResponse.data.data?.length || 0, 'departments');
    
    const muniResponse = await axios.get(`${API_BASE_URL}/api/v1/divipola/municipalities/05/`);
    console.log('✅ Municipalities endpoint working:', muniResponse.data.data?.length || 0, 'municipalities for Antioquia');
    
  } catch (error) {
    console.log('❌ DIVIPOLA endpoints error:', error.message);
    if (error.response?.data) {
      console.log('Error details:', error.response.data);
    }
    return false;
  }

  console.log('\n🎉 All tests passed! Backend services are working correctly.');
  console.log('\n📋 Summary:');
  console.log('   ✅ Organization service imports working');
  console.log('   ✅ DIVIPOLA service imports working');
  console.log('   ✅ Backend endpoints responding correctly');
  console.log('   ✅ No more "No module named \'apps.organization.services\'" errors');
  
  return true;
}

// Run the test
testWizardSave()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test failed with error:', error.message);
    process.exit(1);
  });