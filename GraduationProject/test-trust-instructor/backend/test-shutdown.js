const axios = require('axios');

// Test shutdown functionality
async function testShutdown() {
  try {
    console.log('Testing shutdown functionality...');
    
    // Replace these with actual values from your system
    const studentId = 'test-student-id';
    const examId = 'test-exam-id';
    
    console.log(`Testing shutdown for student: ${studentId}, exam: ${examId}`);
    
    const response = await axios.post(`http://localhost:5000/api/instructors/students/${studentId}/shutdown`, {
      examId: examId,
      instructorId: 'test-instructor'
    });
    
    console.log('Shutdown response:', response.data);
    
    if (response.data.success) {
      console.log('✅ Shutdown test successful');
    } else {
      console.log('❌ Shutdown test failed');
    }
    
  } catch (error) {
    console.error('❌ Shutdown test error:', error.response?.data || error.message);
  }
}

// Test power-on functionality
async function testPowerOn() {
  try {
    console.log('Testing power-on functionality...');
    
    // Replace these with actual values from your system
    const studentId = 'test-student-id';
    const examId = 'test-exam-id';
    
    console.log(`Testing power-on for student: ${studentId}, exam: ${examId}`);
    
    const response = await axios.post(`http://localhost:5000/api/instructors/students/${studentId}/poweron`, {
      examId: examId
    });
    
    console.log('Power-on response:', response.data);
    
    if (response.data.success) {
      console.log('✅ Power-on test successful');
    } else {
      console.log('❌ Power-on test failed');
    }
    
  } catch (error) {
    console.error('❌ Power-on test error:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting shutdown/power-on tests...\n');
  
  await testShutdown();
  console.log('');
  await testPowerOn();
  
  console.log('\n🏁 Tests completed');
}

runTests(); 