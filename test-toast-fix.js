#!/usr/bin/env node

/**
 * Quick test to verify toast duplication fix
 * This script tests the organization wizard flow to ensure single toast notifications
 */

const puppeteer = require('puppeteer');

async function testToastFix() {
  console.log('🧪 Testing toast duplication fix...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1366, height: 768 }
  });
  
  const page = await browser.newPage();
  
  // Track toast notifications
  let toastCount = 0;
  const toastMessages = [];
  
  // Listen for toast notifications
  page.on('console', msg => {
    if (msg.text().includes('toastify')) {
      toastCount++;
      toastMessages.push(msg.text());
      console.log(`📢 Toast detected: ${msg.text()}`);
    }
  });
  
  try {
    // 1. Navigate to login page
    console.log('1. Navegando a la página de login...');
    await page.goto('http://localhost:3001/login');
    await page.waitForSelector('input[type="email"]');
    
    // 2. Login with test credentials
    console.log('2. Iniciando sesión...');
    
    // Clear fields first, then type
    await page.click('input[type="email"]', { clickCount: 3 });
    await page.type('input[type="email"]', 'admin@zentraqms.com');
    
    await page.click('input[type="password"]', { clickCount: 3 });
    await page.type('input[type="password"]', '123456');
    
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForNavigation();
    console.log('3. Login exitoso, navegando al wizard...');
    
    // 3. Navigate to organization wizard
    await page.goto('http://localhost:3001/organization/wizard');
    await page.waitForSelector('.step-arrow-nav', { timeout: 10000 });
    
    console.log('4. Wizard cargado, iniciando prueba de flujo...');
    
    // 4. Fill Step 1 - Organization Data
    await page.type('input#org-name', 'Test Company SAS');
    await page.type('input#org-email', 'test@company.com');
    await page.type('input#org-phone', '+57 300 123 4567');
    await page.type('textarea#org-description', 'Empresa de prueba para validar toasts');
    
    // Fill NIT
    await page.type('input[placeholder="Ingrese el NIT"]', '901234567');
    
    // Click Next
    console.log('5. Completando Paso 1...');
    await page.click('button:has-text("Siguiente: Ubicación")');
    
    // 5. Fill Step 2 - Location Data
    await page.waitForSelector('input[placeholder*="dirección"]', { timeout: 5000 });
    await page.type('input[placeholder*="dirección"]', 'Calle 123 # 45-67');
    await page.type('input[placeholder*="ciudad"]', 'Bogotá');
    await page.type('input[placeholder*="departamento"]', 'Cundinamarca');
    
    // Click Next
    console.log('6. Completando Paso 2...');
    await page.click('button:has-text("Siguiente: Configuración")');
    
    // 6. Fill Step 3 - Sector Template
    await page.waitForSelector('select', { timeout: 5000 });
    await page.select('select[name="sector_template"]', 'tecnologia');
    
    // Submit the form
    console.log('7. Enviando formulario final...');
    toastCount = 0; // Reset counter before critical test
    
    await page.click('button:has-text("Completar Configuración")');
    
    // Wait for success and check toasts
    console.log('8. Esperando notificaciones...');
    await page.waitForTimeout(3000);
    
    // Check for duplicate success toasts
    const successToasts = toastMessages.filter(msg => 
      msg.includes('exitoso') || msg.includes('configurada') || msg.includes('completada')
    );
    
    console.log(`\n📊 Resultado del test:`);
    console.log(`   Total toasts detectados: ${toastCount}`);
    console.log(`   Toasts de éxito: ${successToasts.length}`);
    console.log(`   Mensajes: ${successToasts.join(', ')}`);
    
    if (successToasts.length <= 1) {
      console.log('✅ TEST EXITOSO: No hay duplicados de toast');
    } else {
      console.log('❌ TEST FALLIDO: Toasts duplicados detectados');
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  } finally {
    await browser.close();
  }
}

// Execute test
testToastFix().catch(console.error);