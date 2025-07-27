const ngrok = require('@ngrok/ngrok');
require('dotenv').config();

/**
 * Ngrok Integration for ChatBot-Web
 *
 * This script creates a secure tunnel to your local ChatBot-Web server
 * making it accessible from the internet for testing and sharing.
 */

async function startNgrokTunnel() {
  try {
    const port = process.env.PORT || 3000;
    
    console.log('🚀 Starting ngrok tunnel...');
    console.log(`📡 Tunneling local server on port ${port}`);
    
    // Create ngrok tunnel
    const listener = await ngrok.connect({
      addr: port,
      authtoken_from_env: true,
      // Optional: Add custom subdomain if you have a paid plan
      // subdomain: 'my-chatbot',
    });
    
    const publicUrl = listener.url();
    console.log('✅ Ngrok tunnel established!');
    console.log(`🌐 Public URL: ${publicUrl}`);
    console.log(`🔗 Share this URL to access your ChatBot-Web from anywhere`);
    console.log('');
    console.log('📋 Quick Setup:');
    console.log(`   1. Make sure your server is running on port ${port}`);
    console.log(`   2. Share the public URL: ${publicUrl}`);
    console.log(`   3. Access your chatbot from any device with internet`);
    console.log('');
    console.log('⚠️  Note: Keep this process running to maintain the tunnel');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down ngrok tunnel...');
      await listener.close();
      console.log('✅ Ngrok tunnel closed');
      process.exit(0);
    });
    
    // Keep the process alive
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received SIGTERM, shutting down ngrok tunnel...');
      await listener.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start ngrok tunnel:', error.message);
    
    if (error.message.includes('authtoken')) {
      console.log('');
      console.log('💡 Setup Instructions:');
      console.log('   1. Sign up at https://ngrok.com/');
      console.log('   2. Get your authtoken from the dashboard');
      console.log('   3. Set it as environment variable: NGROK_AUTHTOKEN=your_token');
      console.log('   4. Or run: ngrok authtoken your_token');
    }
    
    process.exit(1);
  }
}

// Start the tunnel if this file is run directly
if (require.main === module) {
  startNgrokTunnel();
}

module.exports = { startNgrokTunnel };