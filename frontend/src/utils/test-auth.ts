// Utilidades para testing manual de autenticación

export const testAuthFlow = {
  // Test 1: Login exitoso
  async testSuccessfulLogin() {
    console.log('🧪 Test 1: Login exitoso');
    try {
      // Simular login con credenciales válidas
      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'Test1234!'
        })
      });
      
      const data = await response.json();
      console.log('✅ Login response:', data);
      
      // Verificar tokens
      if (data.access && data.refresh) {
        console.log('✅ Tokens recibidos correctamente');
        return data;
      } else {
        console.error('❌ Tokens no recibidos');
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
    }
  },

  // Test 2: Acceso a endpoint protegido
  async testProtectedEndpoint(accessToken: string) {
    console.log('🧪 Test 2: Endpoint protegido');
    try {
      const response = await fetch('http://localhost:8000/api/auth/user/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Usuario obtenido:', data);
      } else {
        console.error('❌ Error al acceder:', response.status);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  },

  // Test 3: Refresh token
  async testRefreshToken(refreshToken: string) {
    console.log('🧪 Test 3: Refresh token');
    try {
      const response = await fetch('http://localhost:8000/api/auth/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Nuevo access token:', data.access);
        return data.access;
      } else {
        console.error('❌ Error en refresh:', response.status);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  },

  // Test 4: Logout
  async testLogout(refreshToken: string, accessToken: string) {
    console.log('🧪 Test 4: Logout');
    try {
      const response = await fetch('http://localhost:8000/api/auth/logout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ refresh: refreshToken })
      });
      
      if (response.ok) {
        console.log('✅ Logout exitoso');
      } else {
        console.error('❌ Error en logout:', response.status);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  },

  // Ejecutar todos los tests
  async runAllTests() {
    console.log('🚀 Iniciando suite de tests de autenticación...\n');
    
    // Test 1: Login
    const loginData = await this.testSuccessfulLogin();
    if (!loginData) return;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Protected endpoint
    await this.testProtectedEndpoint(loginData.access);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Refresh
    const newToken = await this.testRefreshToken(loginData.refresh);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 4: Logout
    await this.testLogout(loginData.refresh, newToken || loginData.access);
    
    console.log('\n✅ Suite de tests completada');
  }
};

// Exponer en window para testing en consola
if (import.meta.env.DEV) {
  (window as any).testAuth = testAuthFlow;
  console.log('💡 Tip: Usa window.testAuth.runAllTests() en la consola para probar');
}