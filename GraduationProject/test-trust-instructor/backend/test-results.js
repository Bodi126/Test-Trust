const mongoose = require('mongoose');
const Result = require('./models/result');
const Exam = require('./models/exam');
const Student = require('./models/student');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/TestTrust', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

async function testResultsAPI() {
  try {
    console.log('🔍 Testing Results API and Database...\n');

    // 1. Check total counts
    const totalResults = await Result.countDocuments();
    const totalExams = await Exam.countDocuments();
    const totalStudents = await Student.countDocuments();

    console.log('📊 Database Statistics:');
    console.log(`- Total Results: ${totalResults}`);
    console.log(`- Total Exams: ${totalExams}`);
    console.log(`- Total Students: ${totalStudents}\n`);

    if (totalResults === 0) {
      console.log('⚠️  No results found in database. Creating sample data...\n');
      await createSampleData();
    }

    // 2. Get sample results with populated data
    const sampleResults = await Result.find()
      .populate('examId', 'subject department year')
      .limit(5);

    console.log('📋 Sample Results:');
    sampleResults.forEach((result, index) => {
      console.log(`${index + 1}. Student: ${result.studentNationalId}`);
      console.log(`   Exam: ${result.examId?.subject || 'N/A'}`);
      console.log(`   Score: ${result.totalScore}/${result.maxScore} (${result.percentage.toFixed(1)}%)`);
      console.log(`   Grade: ${result.finalGrade}`);
      console.log(`   Auto-graded: ${result.isAutoGraded}`);
      console.log('');
    });

    // 3. Test the dashboard API logic
    console.log('🧪 Testing Dashboard API Logic...\n');
    
    const exams = await Exam.find().select('_id subject department year');
    const examIds = exams.map(exam => exam._id);
    
    const results = await Result.find({ examId: { $in: examIds } })
      .populate('examId', 'subject department year')
      .sort({ createdAt: -1 });

    const studentIds = [...new Set(results.map(r => r.studentNationalId))];
    const students = await Student.find({ nationalId: { $in: studentIds } })
      .select('fullName nationalId department academicYear');

    const studentMap = students.reduce((acc, student) => {
      acc[student.nationalId] = student;
      return acc;
    }, {});

    const enrichedResults = results.map(result => {
      const student = studentMap[result.studentNationalId];
      return {
        id: result._id,
        name: student ? student.fullName : 'Unknown Student',
        avatar: student ? student.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'UN',
        year: result.examId?.year || 'N/A',
        department: result.examId?.department || student?.department || 'N/A',
        subject: result.examId?.subject || 'N/A',
        score: Math.round(result.percentage),
        grade: result.finalGrade,
        status: result.percentage >= 60 ? 'Passed' : 'Failed'
      };
    });

    console.log('📈 Enriched Results Sample:');
    enrichedResults.slice(0, 3).forEach((result, index) => {
      console.log(`${index + 1}. ${result.name} (${result.avatar})`);
      console.log(`   ${result.subject} - ${result.department} - ${result.year}`);
      console.log(`   Score: ${result.score}% | Grade: ${result.grade} | Status: ${result.status}`);
      console.log('');
    });

    // 4. Calculate summary statistics
    const totalResultsCount = enrichedResults.length;
    const passedResults = enrichedResults.filter(r => r.status === 'Passed').length;
    const averageScore = totalResultsCount > 0 ? 
      Math.round(enrichedResults.reduce((sum, r) => sum + r.score, 0) / totalResultsCount) : 0;

    console.log('📊 Summary Statistics:');
    console.log(`- Total Results: ${totalResultsCount}`);
    console.log(`- Passed: ${passedResults}`);
    console.log(`- Failed: ${totalResultsCount - passedResults}`);
    console.log(`- Pass Rate: ${totalResultsCount > 0 ? Math.round((passedResults / totalResultsCount) * 100) : 0}%`);
    console.log(`- Average Score: ${averageScore}%`);

    // 5. Get unique filter values
    const years = [...new Set(enrichedResults.map(r => r.year))].filter(y => y !== 'N/A');
    const departments = [...new Set(enrichedResults.map(r => r.department))].filter(d => d !== 'N/A');
    const subjects = [...new Set(enrichedResults.map(r => r.subject))].filter(s => s !== 'N/A');

    console.log('\n🔍 Available Filter Values:');
    console.log(`- Years: ${years.join(', ')}`);
    console.log(`- Departments: ${departments.join(', ')}`);
    console.log(`- Subjects: ${subjects.join(', ')}`);

    console.log('\n✅ Results API test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing Results API:', error);
  } finally {
    mongoose.connection.close();
  }
}

async function createSampleData() {
  try {
    // Create sample exam if none exists
    let exam = await Exam.findOne();
    if (!exam) {
      exam = await Exam.create({
        department: 'Computer Science',
        year: '2024',
        subject: 'Data Structures',
        studentCount: 30,
        examDate: new Date('2024-01-15'),
        examTime: '10:00',
        examDuration: 120,
        totalMarks: 100,
        questionCount: 10,
        autoCorrection: true,
        createdBy: 'test@example.com'
      });
      console.log('✅ Created sample exam');
    }

    // Create sample student if none exists
    let student = await Student.findOne();
    if (!student) {
      student = await Student.create({
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        nationalId: '123456789',
        section: 'A',
        department: 'Computer Science',
        academicYear: '2024',
        idPhoto: 'sample-photo.jpg'
      });
      console.log('✅ Created sample student');
    }

    // Create sample result
    const result = await Result.create({
      examId: exam._id,
      studentNationalId: student.nationalId,
      totalScore: 85,
      maxScore: 100,
      percentage: 85,
      finalGrade: 'A',
      isAutoGraded: true,
      gradedAnswers: []
    });
    console.log('✅ Created sample result');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
}

// Run the test
testResultsAPI(); 