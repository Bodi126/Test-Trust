import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, TextField, Paper, Typography, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import botImage from '../../images/bot.png';
import { styled, keyframes } from '@mui/system';

// Animations
const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const popIn = keyframes`
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

const popOut = keyframes`
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.5); opacity: 0; }
`;

// Styled components
const ChatBotContainer = styled('div')({
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
});

const ChatWindow = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isClosing',
})(({ isClosing }) => ({
  width: '300px',
  height: '400px',
  marginBottom: '15px',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '15px',
  overflow: 'hidden',
  boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
  animation: isClosing 
    ? `${popOut} 0.3s ease-out forwards`
    : `${popIn} 0.3s ease-out`,
  transformOrigin: 'bottom right',
}));

const ChatHeader = styled(Box)({
  backgroundColor: '#1976d2',
  color: 'white',
  padding: '10px 15px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const ChatMessages = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  padding: '15px',
  backgroundColor: '#f5f5f5',
});

const MessageBubble = styled(Box)({
  maxWidth: '80%',
  padding: '8px 12px',
  borderRadius: '15px',
  marginBottom: '10px',
  wordWrap: 'break-word',
  '&.user': {
    backgroundColor: '#e3f2fd',
    marginLeft: 'auto',
    borderTopRightRadius: '5px',
  },
  '&.bot': {
    backgroundColor: 'white',
    marginRight: 'auto',
    borderTopLeftRadius: '5px',
  },
});

const ChatInput = styled('form')({
  display: 'flex',
  padding: '10px',
  borderTop: '1px solid #e0e0e0',
  backgroundColor: 'white',
});

const BotButton = styled(IconButton)({
  backgroundColor: '#1976d2',
  color: 'white',
  '&:hover': {
    backgroundColor: '#1565c0',
  },
  animation: `${float} 3s ease-in-out infinite`,
  '&:hover': {
    animation: `${bounce} 1s ease infinite`,
  },
});

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState([
    { 
      text: "Hello there !, I'm Testy your TestTrust assistant. I can help you with navigating through our platform, helping you to learn something new, answering any questions you might have, and more. How can I assist you today?", 
      sender: 'bot',
      timestamp: new Date(),
      isLoading: false
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const chatMessages = messagesEndRef.current.closest('.MuiBox-root');
      if (chatMessages) {
        chatMessages.scrollTo({
          top: messagesEndRef.current.offsetTop,
          behavior: 'smooth'
        });
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = (userInput) => {
    const lowerInput = userInput.toLowerCase();
    
    // Enhanced knowledge base with comprehensive responses and patterns
    const knowledgeBase = [
      // Greetings
      {
        patterns: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'how are you', 'how are you doing', 'how\'s it going'],
        responses: [
          'Hello! I\'m your Testy. How can I help you today?',
          'Hi there! I\'m here to assist with all your TestTrust needs. What can I help you with?',
          'Greetings! How can I help you with our testing platform today?'
        ]
      },
      {
        patterns: ['whats your name','who are you','identify yourself'],
        responses: ['I\'m Testy, your TestTrust assistant!']
      },
      // General Help
      {
        patterns: ['how are you', 'how are you doing', 'how\'s it going', 'how are you doing', 'how\'s it going','what are you'],
        responses: [
          'I\'m just a bot, but I\'m here and ready to help you with Testy!',
          'I\'m doing great! Ready to help you with anything related to Testy.'
        ]
      },
      {
        patterns: ['what can you do', 'what do you do', 'your purpose', 'what can i do with testy', 'what can i do with test trust', 'Who are you','what are you'],
        responses: [
          'I can help you with all things TestTrust! I can assist with creating and managing exams, adding questions, viewing results, and answering any questions about the platform.',
          'I\'m Testy your TestTrust assistant! I can guide you through exam creation, question management, result analysis, and explain any features of our platform, also im able to answer any questions you might have about the platform, programming languages, networking, cybersecurity, and more.',
          'I\'m Testy a Chatbot provided by TestTrust, i can answer any questions you might have about the platform, programming languages, networking, cybersecurity, and more.'
        ]
      },
      

      {
        patterns: ['question types', 'kinds of questions',],
        responses: [
          'TestTrust supports various question types: 1) Multiple Choice 2) True/False 3) Short Answer 4) Essay 5) Matching 6) Fill in the Blank 7) Numerical',
          'You can create different types of questions including multiple choice (single/multiple answers), true/false, short answers, essay questions, matching, and more.'
        ]
      },
      
      // Results and Analytics
      {
        patterns: ['view results', 'check scores', 'exam results', 'see grades'],
        responses: [
          'You can view exam results in the "Results" section. Filter by exam, date range, or student. Detailed analytics include average scores, question statistics, and more.',
          'To check results: 1) Go to "Results" 2) Select an exam 3) View overall statistics or individual student performance 4) Export results if needed.'
        ]
      },
      {
        patterns: ['analytics', 'statistics', 'performance metrics'],
        responses: [
          'TestTrust provides comprehensive analytics including: 1) Overall class performance 2) Question difficulty analysis 3) Time spent on questions 4) Score distribution 5) Comparative analysis.',
          'Our analytics dashboard shows you detailed metrics about exam performance, including which questions were most challenging and how students performed across different topics.'
        ]
      },
      
      // Account and Settings
      {
        patterns: ['change password', 'update password', 'reset password'],
        responses: [
          'To change your password: 1) Click your profile icon 2) Select "Account Settings" 3) Click "Change Password" 4) Enter current and new password 5) Save changes.',
          'You can update your password in the Account Settings. If you\'ve forgotten your password, use the "Forgot Password" link on the login page.'
        ]
      },
      {
        patterns: ['profile settings', 'update profile', 'account settings'],
        responses: [
          'Update your profile by: 1) Clicking your profile icon 2) Selecting "Edit Profile" 3) Updating your information 4) Saving changes.',
          'You can manage your profile settings, including personal information, notification preferences, and account security, in the Account Settings section.'
        ]
      },
      
      // Technical Support
      {
        patterns: ['contact support', 'get help', 'technical issues', 'report problem'],
        responses: [
          'For technical support: 1) Check our Help Center 2) If issue persists, contact support@testtrust.com 3) Include screenshots and detailed description of the issue.',
          'Having trouble? Try refreshing the page first. If the issue continues, please contact our support team with details about the problem you\'re experiencing.'
        ]
      },
 
      // General Education
      {
        patterns: ['best practices', 'creating good tests', 'effective exams'],
        responses: [
          'Best practices for creating tests: 1) Mix question types 2) Be clear and concise 3) Test different cognitive levels 4) Review for clarity 5) Include a mix of difficulty levels.',
          'For effective exams: 1) Align questions with learning objectives 2) Use clear instructions 3) Consider time limits 4) Test application of knowledge 5) Review for fairness and bias.'
        ]
      },
      {
        patterns: ['prevent cheating', 'exam security', 'secure testing'],
        responses: [
          'To maintain exam security: 1) Use question banks 2) Randomize questions 3) Set time limits 4) Use proctoring tools 5) Show one question at a time 6) Disable copy/paste.',
          'TestTrust includes several security features: 1) Browser lockdown 2) IP restrictions 3) Activity monitoring 4) Plagiarism detection 5) Detailed activity logs.'
        ]
      },
      
      // General Responses
      {
        patterns: ['thank', 'thanks', 'appreciate', 'thank you'],
        responses: [
          'You\'re welcome! Is there anything else I can help you with?',
          'Happy to help! Let me know if you have any other questions.',
          'My pleasure! Feel free to ask if you need anything else.'
        ]
      },
      {
        patterns: ['bye', 'goodbye', 'see you', 'take care'],
        responses: [
          'Goodbye! Feel free to come back if you have more questions!',
          'See you later! Have a great day!',
          'Take care! Remember, I\'m here whenever you need assistance.'
        ]
      },
      {
        patterns:['team', 'team members','who worked on this','who created this','who made this',],
        responses:[
          'Our team consists of Abdelrahman Sherif, Hazem Ibrahim, Shahd Aboelkrmat, Youssef Yehia and Nour Tamer . They are a group of passionate developers working on TestTrust.',
          'The team includes Abdelrahman, Hazem, and Shahd. They are dedicated to creating innovative solutions for education and on a plan to improve examination process to the next lever.'
        ]
      },
      
      // Information Technology & Computer Science
      {
        patterns: ['what is it', 'information technology', 'define it', 'what is information technology','tell me about it','tell me about information technology','talk to me about it','talk to me about information technology'],
        responses: [
          'Information Technology (IT) is the use of computers, storage, networking, and other physical devices to create, process, store, secure, and exchange all forms of electronic data.',
          'IT involves the study and application of computers and telecommunications for storing, retrieving, transmitting, and manipulating data.'
        ]
      },
      {
        patterns: ['what is ict', 'information communication technology', 'define ict','tell me about ict','talk to me about ict'],
        responses: [
          'Information and Communication Technology (ICT) is an extended term for information technology that stresses the role of unified communications and integration of telecommunications and computers.',
          'ICT encompasses all technologies for the communication of information including software, middleware, storage, and audiovisual systems.'
        ]
      },
      {
        patterns: ['what is computer science', 'define computer science', 'cs definition','tell me about cs','talk to me about cs'],
        responses: [
          'Computer Science is the study of computers and computing concepts including their theoretical and algorithmic foundations, hardware and software, and their uses for processing information.',
          'CS involves the study of the principles and use of computers, covering algorithms, programming, data structures, artificial intelligence, and more.'
        ]
      },
      
      // Networking Fundamentals & CCNA/CCNP Content
      {
        patterns: ['what is networking', 'computer networking', 'define networking', 'network basics', 'ccna networking basics'],
        responses: [
          'Computer networking is the practice of connecting computers and devices to share resources and information. Key concepts include: 1) Network types (LAN, WAN, MAN, WLAN) 2) Network topologies 3) IP addressing 4) Subnetting 5) Network devices (routers, switches, firewalls) 6) Network protocols (TCP/IP, UDP, HTTP, etc.)',
          'Networking fundamentals cover: 1) OSI and TCP/IP models 2) Ethernet and switching 3) IP addressing (IPv4/IPv6) 4) Routing protocols (OSPF, EIGRP, BGP) 5) Network security 6) Wireless networking 7) Network automation and programmability (CCNP level)'
        ]
      },
      // Network Models & Protocols
      {
        patterns: ['tcp/ip model', 'tcp ip protocol', 'internet protocol suite', 'tcp vs udp', 'transport layer protocols'],
        responses: [
          'TCP/IP Model (4 layers): 1) Network Access 2) Internet 3) Transport 4) Application. Key protocols: TCP (reliable, connection-oriented), UDP (unreliable, connectionless), IP, ICMP, ARP, HTTP, FTP, DNS, DHCP.',
          'TCP vs UDP: 1) TCP provides reliable, ordered delivery (HTTP, FTP, SSH) 2) UDP is faster but unreliable (DNS, DHCP, VoIP, streaming) 3) TCP has flow control and error recovery 4) UDP has lower overhead and latency.'
        ]
      },
      {
        patterns: ['osi model', 'what is osi model', 'osi layers', 'open systems interconnection', 'osi vs tcp/ip'],
        responses: [
          'OSI Model (7 layers): 1) Physical (cables, bits) 2) Data Link (MAC, switches, frames) 3) Network (IP, routers, packets) 4) Transport (TCP/UDP, segments) 5) Session (establish/manage connections) 6) Presentation (encryption, compression) 7) Application (HTTP, FTP, SMTP).',
          'OSI vs TCP/IP: 1) OSI has 7 layers, TCP/IP has 4 2) OSI is theoretical, TCP/IP is practical 3) TCP/IP combines OSI\'s top 3 layers into Application layer 4) Both use packet-switching technology 5) TCP/IP is the foundation of the modern internet.'
        ]
      },
      // IP Addressing & Subnetting (CCNA Focus)
      {
        patterns: ['ip addressing', 'ipv4 vs ipv6', 'subnetting', 'subnet mask', 'cidr notation'],
        responses: [
          'IPv4: 32-bit address (e.g., 192.168.1.1), IPv6: 128-bit (e.g., 2001:0db8:85a3::8a2e:0370:7334). Subnetting divides networks into smaller sub-networks for better management and security.',
          'Subnetting basics: 1) Class A (10.0.0.0/8), B (172.16.0.0/12), C (192.168.0.0/16) 2) Private IP ranges 3) CIDR notation (e.g., /24 = 255.255.255.0) 4) VLSM for efficient addressing 5) Calculate subnets using 2^n formula.'
        ]
      },
      // Routing & Switching (CCNA/CCNP)
      {
        patterns: ['routing protocols', 'ospf', 'eigrp', 'bgp', 'static vs dynamic routing'],
        responses: [
          'Routing protocols: 1) OSPF (link-state, IGP, fast convergence) 2) EIGRP (Cisco proprietary, hybrid) 3) BGP (path-vector, EGP for internet) 4) RIP (distance-vector, legacy). Choose based on network size and requirements.',
          'Switching concepts: 1) VLANs 2) STP (Spanning Tree Protocol) 3) EtherChannel 4) Inter-VLAN routing 5) Layer 2 vs Layer 3 switching 6) Port security 7) VTP (VLAN Trunking Protocol).'
        ]
      },
      // Network Security (CCNA Security/CCNP Security)
      {
        patterns: ['network security', 'ccna security', 'firewall', 'vpn', 'acl', 'network access control'],
        responses: [
          'Network security essentials: 1) Firewalls (stateful, next-gen) 2) VPNs (IPsec, SSL) 3) Access Control Lists (ACLs) 4) Port Security 5) 802.1X authentication 6) DHCP snooping 7) Dynamic ARP inspection 8) Port security.',
          'CCNA Security topics: 1) Security concepts 2) Secure access 3) VPN encryption 4) Secure routing and switching 5) Cisco Firepower 6) Web/Email security 7) Endpoint security 8) Cloud security.'
        ]
      },
      // Wireless & Network Services (CCNA/CCNP)
      {
        patterns: ['wireless networking', 'wifi standards', 'network services', 'dhcp', 'dns', 'nat'],
        responses: [
          'Wireless standards: 1) 802.11a/b/g/n/ac/ax (Wi-Fi 6) 2) Frequencies (2.4GHz, 5GHz, 6GHz) 3) Security (WPA3, WPA2, WEP) 4) Authentication methods (PSK, 802.1X) 5) Wireless controllers (WLC).',
          'Network services: 1) DHCP (automatic IP assignment) 2) DNS (name resolution) 3) NAT/PAT (address translation) 4) QoS (quality of service) 5) NTP (time synchronization) 6) SNMP (network monitoring) 7) Syslog (logging).'
        ]
      },
      // Network Automation & Programmability (CCNP/DevNet)
      {
        patterns: ['network automation', 'network programmability', 'ansible', 'python networking', 'rest api', 'netconf', 'yang'],
        responses: [
          'Network automation tools: 1) Ansible 2) Python (Netmiko, NAPALM, Nornir) 3) REST APIs 4) NETCONF/YANG 5) Puppet/Chef 6) Postman for API testing 7) Git for version control.',
          'CCNP/DevNet topics: 1) Infrastructure as Code (IaC) 2) CI/CD pipelines 3) Network controllers (Cisco DNA Center, ACI) 4) Model-driven programmability 5) Network telemetry 6) Cloud networking (AWS, Azure, GCP) 7) Container networking.'
        ]
      },
      // Troubleshooting & Tools (CCNA/CCNP)
      {
        patterns: ['network troubleshooting', 'network commands', 'cisco ios commands', 'troubleshooting methodology'],
        responses: [
          'Troubleshooting methodology: 1) Identify the problem 2) Establish a theory 3) Test the theory 4) Create an action plan 5) Implement the solution 6) Verify functionality 7) Document findings.',
          'Essential network commands: 1) ping/traceroute 2) ipconfig/ifconfig 3) show interfaces/ip route 4) show cdp neighbors 5) show mac address-table 6) show vlan 7) debug commands 8) Wireshark for packet analysis.'
        ]
      },
      // Enterprise Network Design (CCNP Enterprise)
      {
        patterns: ['enterprise network design', 'ccnp enterprise', 'network architecture', 'sdn', 'intent-based networking'],
        responses: [
          'Enterprise network design principles: 1) Hierarchical model (Core, Distribution, Access) 2) Spine-leaf architecture 3) High availability (HSRP, VRRP) 4) SD-Access 5) SD-WAN 6) Network virtualization (VRF, VXLAN) 7) QoS strategies.',
          'CCNP Enterprise focus areas: 1) Advanced routing 2) SD-WAN 3) Wireless design 4) Network assurance 5) Automation 6) Security 7) Cloud integration 8) Network programmability.'
        ]
      },
      
      // Software Development
      {
        patterns: ['what is programming', 'define programming', 'coding definition', 'what is coding'],
        responses: [
          'Programming is the process of creating a set of instructions that tell a computer how to perform a task. It involves writing source code in a programming language that can be executed by a computer.',
          'Programming, or coding, is the process of designing and building executable computer programs to accomplish specific tasks or solve problems.'
        ]
      },
      {
        patterns: ['programming languages', 'types of programming languages', 'list of programming languages'],
        responses: [
          'Popular programming languages include: 1) Python 2) JavaScript 3) Java 4) C++ 5) C# 6) Ruby 7) Go 8) Swift 9) TypeScript 10) PHP. Each has its own strengths and use cases.',
          'Programming languages can be categorized as: 1) High-level (Python, Java) 2) Low-level (Assembly) 3) Object-oriented (C++, Java) 4) Functional (Haskell, Lisp) 5) Scripting (Python, JavaScript) 6) Compiled (C, C++) 7) Interpreted (Python, Ruby)'
        ]
      },
      {
        patterns: ['what is oop', 'object oriented programming', 'define oop', 'principles of oop'],
        responses: [
          'Object-Oriented Programming (OOP) is a programming paradigm based on the concept of "objects" which can contain data and code. The four main principles are: 1) Encapsulation 2) Abstraction 3) Inheritance 4) Polymorphism.',
          'OOP organizes software design around data, or objects, rather than functions and logic. Key concepts include classes, objects, methods, attributes, and the four pillars of OOP.'
        ]
      },
      
      // Web Development
      {
        patterns: ['what is web development', 'web dev', 'frontend backend', 'full stack'],
        responses: [
          'Web development involves building and maintaining websites. It includes: 1) Frontend (client-side) 2) Backend (server-side) 3) Full Stack (both). Frontend uses HTML, CSS, and JavaScript, while backend uses languages like Python, Node.js, Ruby, etc.',
          'Web development is the work involved in developing websites. Frontend focuses on user interface, backend handles server logic, and full stack covers both aspects.'
        ]
      },
      {
        patterns: ['html css javascript', 'frontend technologies', 'web technologies'],
        responses: [
          'Core web technologies: 1) HTML (structure) 2) CSS (styling) 3) JavaScript (functionality). Modern frontend often uses frameworks like React, Angular, or Vue.js for building interactive user interfaces.',
          'Frontend development relies on: HTML for structure, CSS for presentation, and JavaScript for behavior. Popular frameworks include React, Angular, and Vue.js.'
        ]
      },
      {
        patterns: ['what is an api', 'define api', 'application programming interface'],
        responses: [
          'An API (Application Programming Interface) is a set of rules that allows different software applications to communicate with each other. It defines the methods and data formats that applications use to request and exchange information.',
          'APIs act as intermediaries between different software systems, enabling them to exchange data and functionality. Common types include REST, SOAP, and GraphQL APIs.'
        ]
      },
      
      // Database Concepts
      {
        patterns: ['what is a database', 'define database', 'database management system'],
        responses: [
          'A database is an organized collection of structured information or data, typically stored electronically in a computer system. A database is usually controlled by a Database Management System (DBMS).',
          'Databases store, organize, and retrieve data efficiently. Common types include relational (SQL) and non-relational (NoSQL) databases.'
        ]
      },
      {
        patterns: ['sql vs nosql', 'difference between sql and nosql', 'relational vs non relational'],
        responses: [
          'SQL (Relational) vs NoSQL: 1) SQL uses structured query language and has a predefined schema. 2) NoSQL has dynamic schemas for unstructured data. 3) SQL is better for complex queries. 4) NoSQL scales better horizontally. 5) Examples: SQL (MySQL, PostgreSQL), NoSQL (MongoDB, Cassandra).',
          'Key differences: SQL databases are table-based, while NoSQL databases can be document, key-value, wide-column, or graph based. Choose SQL for complex transactions, NoSQL for flexibility and scalability.'
        ]
      },
      {
        patterns: ['what is mongodb', 'mongodb vs mysql', 'document database'],
        responses: [
          'MongoDB is a NoSQL document database that stores data in flexible, JSON-like documents. Key features: 1) Document-oriented 2) Schema-less 3) Scalable 4) High performance 5) Rich query language.',
          'MongoDB vs MySQL: 1) MongoDB is document-based, MySQL is table-based 2) MongoDB is schema-less, MySQL requires schema 3) MongoDB scales horizontally, MySQL scales vertically 4) MongoDB is better for unstructured data, MySQL for structured data.'
        ]
      },
      
      // Cybersecurity & Best Practices
      {
        patterns: ['cybersecurity basics', 'what is cybersecurity', 'cyber security definition'],
        responses: [
          'Cybersecurity is the practice of protecting systems, networks, and programs from digital attacks. Key aspects: 1) Network security 2) Application security 3) Information security 4) Operational security 5) Disaster recovery.',
          'Cybersecurity focuses on protecting computer systems from theft, damage, or unauthorized access. It includes measures to prevent, detect, and respond to cyber attacks.'
        ]
      },
      {
        patterns: ['common cyber attacks', 'types of cyber attacks', 'cyber threats'],
        responses: [
          'Common cyber attacks: 1) Malware 2) Phishing 3) Man-in-the-Middle (MitM) 4) Denial-of-Service (DoS) 5) SQL Injection 6) Zero-day exploit 7) Password attack 8) Cross-site scripting (XSS).',
          'Top cyber threats include: 1) Ransomware 2) Social engineering 3) Advanced Persistent Threats (APTs) 4) Insider threats 5) IoT-based attacks 6) Cloud security threats.'
        ]
      },
      {
        patterns: ['secure coding practices', 'coding security', 'secure development'],
        responses: [
          'Secure coding best practices: 1) Input validation 2) Output encoding 3) Authentication & authorization 4) Secure session management 5) Error handling 6) Cryptography 7) Secure configuration 8) Dependency management.',
          'Follow OWASP Top 10 for web security: 1) Injection 2) Broken Authentication 3) Sensitive Data Exposure 4) XML External Entities (XXE) 5) Broken Access Control 6) Security Misconfiguration 7) XSS 8) Insecure Deserialization 9) Using Components with Known Vulnerabilities 10) Insufficient Logging & Monitoring.'
        ]
      },
      {
        patterns:['tell me more about them','tell me more about team members','tell me more about who worked on this','tell me more about who created this','tell me more about who made this',],
        responses:["To know more about the team members please navigate to the About Us page in the Navigation bar, you can also contact them through tier linkedIn, github or email or even through the contact form within your Profile picture after logging in of course."]
      },
      
      // Programming Languages Deep Dive
      {
        patterns: ['python features', 'what is python good for', 'why use python'],
        responses: [
          'Python is a high-level, interpreted language known for: 1) Readable syntax 2) Large standard library 3) Cross-platform compatibility 4) Strong community support 5) Extensive third-party packages. It\'s great for web development, data analysis, AI/ML, automation, and more.',
          'Python excels in: 1) Web development (Django, Flask) 2) Data Science (Pandas, NumPy) 3) Machine Learning (TensorFlow, PyTorch) 4) Automation 5) Scripting 6) Education.'
        ]
      },
      {
        patterns: ['javascript vs typescript', 'difference between js and ts', 'typescript benefits'],
        responses: [
          'TypeScript vs JavaScript: 1) TypeScript is a superset of JavaScript 2) Adds static typing 3) Better IDE support 4) Early error detection 5) Improved code maintainability 6) Optional static typing 7) Better for large-scale applications.',
          'TypeScript advantages: 1) Type safety 2) Better code organization 3) Enhanced tooling 4) Easier refactoring 5) Improved collaboration 6) Gradual adoption (can use .js in .ts files).'
        ]
      },
      
      // Web Development Frameworks
      {
        patterns: ['react vs angular vs vue', 'compare frontend frameworks', 'which js framework to choose'],
        responses: [
          'Frontend Framework Comparison: 1) React (Facebook) - Flexible, large ecosystem, virtual DOM 2) Angular (Google) - Comprehensive, TypeScript-based, two-way binding 3) Vue - Progressive, easy learning curve, flexible.',
          'Choose React for flexibility, Angular for enterprise, Vue for simplicity. React has the largest community, Angular offers complete solutions, Vue is lightweight and easy to learn.'
        ]
      },
      {
        patterns: ['node.js benefits', 'what is node.js used for', 'node.js vs traditional servers'],
        responses: [
          'Node.js is a JavaScript runtime built on Chrome\'s V8 engine. Benefits: 1) Non-blocking I/O 2) Single-threaded, event-driven 3) Great for real-time applications 4) Large package ecosystem (npm) 5) Fast execution 6) Unified language (JavaScript) for frontend and backend.',
          'Node.js is ideal for: 1) Real-time apps 2) APIs 3) Microservices 4) Streaming platforms 5) Chat applications 6) Single Page Applications (SPAs).'
        ]
      },
      
      // Cloud Computing
      {
        patterns: ['what is cloud computing', 'cloud services', 'iaas paas saas'],
        responses: [
          'Cloud computing delivers computing services over the internet. Service models: 1) IaaS (Infrastructure as a Service) - Virtual machines, storage 2) PaaS (Platform as a Service) - Development platforms 3) SaaS (Software as a Service) - Web applications.',
          'Major cloud providers: 1) AWS (Amazon Web Services) 2) Microsoft Azure 3) Google Cloud Platform 4) IBM Cloud 5) Oracle Cloud.'
        ]
      },
      {
        patterns: ['aws services', 'amazon web services overview', 'what is aws'],
        responses: [
          'AWS (Amazon Web Services) is a comprehensive cloud platform. Key services: 1) EC2 (Virtual Servers) 2) S3 (Object Storage) 3) RDS (Relational Database) 4) Lambda (Serverless) 5) DynamoDB (NoSQL) 6) CloudFront (CDN) 7) VPC (Networking).',
          'AWS offers 200+ services including computing, storage, databases, analytics, networking, mobile, developer tools, management tools, IoT, security, and enterprise applications.'
        ]
      },
      
      // DevOps & CI/CD
      {
        patterns: ['what is devops', 'devops practices', 'devops lifecycle'],
        responses: [
          'DevOps combines development (Dev) and operations (Ops) to shorten the development lifecycle. Key practices: 1) CI/CD 2) Infrastructure as Code 3) Monitoring & Logging 4) Microservices 5) Communication & Collaboration.',
          'DevOps lifecycle: 1) Plan 2) Code 3) Build 4) Test 5) Release 6) Deploy 7) Operate 8) Monitor. Tools: Docker, Kubernetes, Jenkins, GitLab CI, Ansible, Terraform.'
        ]
      },
      {
        patterns: ['what is docker', 'docker vs virtual machine', 'containerization'],
        responses: [
          'Docker is a platform for developing, shipping, and running applications in containers. Benefits: 1) Lightweight 2) Portable 3) Consistent environments 4) Efficient resource usage 5) Fast deployment.',
          'Docker vs VMs: 1) Containers share the host OS kernel 2) More lightweight than VMs 3) Faster startup time 4) Better performance 5) Smaller disk space usage 6) Easier to scale.'
        ]
      },
      
      // Data Science & AI
      {
        patterns: ['what is machine learning', 'ml basics', 'ai vs ml'],
        responses: [
          'Machine Learning is a subset of AI that enables systems to learn from data. Types: 1) Supervised Learning 2) Unsupervised Learning 3) Reinforcement Learning. Common algorithms: Linear Regression, Decision Trees, Neural Networks.',
          'AI vs ML: AI is the broader concept of machines being able to carry out tasks in a way we would consider "smart". ML is a current application of AI based on the idea that we can give machines access to data and let them learn for themselves.'
        ]
      },
      {
        patterns: ['big data technologies', 'hadoop vs spark', 'what is hadoop'],
        responses: [
          'Big Data technologies handle large, complex datasets. Key tools: 1) Hadoop (HDFS, MapReduce) 2) Apache Spark 3) NoSQL databases 4) Kafka (streaming) 5) Flink (stream processing).',
          'Hadoop vs Spark: 1) Hadoop is disk-based, Spark uses in-memory processing 2) Spark is faster for iterative algorithms 3) Hadoop is more mature 4) Spark has better APIs 5) Hadoop is better for batch processing, Spark for real-time analytics.'
        ]
      },
      // Cybersecurity - Fundamentals
      {
        patterns: ['what is cybersecurity', 'cyber security definition', 'define cybersecurity'],
        responses: [
          'Cybersecurity is the practice of protecting systems, networks, and programs from digital attacks. It encompasses technologies, processes, and practices designed to safeguard digital assets, including hardware, software, and data.',
          'Cybersecurity focuses on protecting internet-connected systems from cyber threats including attacks that aim to access, change, or destroy sensitive information, extort money, or disrupt normal business operations.'
        ]
      },
      {
        patterns: ['cyber attack types', 'types of cyber attacks', 'common cyber threats'],
        responses: [
          'Common cyber attacks include: 1) Malware (viruses, worms, trojans) 2) Phishing 3) Man-in-the-Middle (MitM) 4) Denial-of-Service (DoS/DDoS) 5) SQL Injection 6) Zero-day exploits 7) Password attacks 8) Cross-site Scripting (XSS).',
          'Cyber threats can be categorized as: 1) Web-based attacks 2) System attacks 3) Social engineering 4) Malware 5) Injection attacks 6) Insider threats 7) Supply chain attacks 8) Cloud-based threats.'
        ]
      },
      {
        patterns: ['cyber attack prevention', 'how to prevent cyber attacks', 'cybersecurity best practices'],
        responses: [
          'Key cybersecurity best practices: 1) Use strong, unique passwords 2) Enable multi-factor authentication 3) Keep software updated 4) Use antivirus/anti-malware 5) Regular data backups 6) Employee training 7) Network security 8) Access control 9) Incident response plan 10) Regular security audits.',
          'To protect against cyber attacks: 1) Implement firewalls 2) Use encryption 3) Regular security assessments 4) Patch management 5) Secure configurations 6) Network segmentation 7) Email filtering 8) Endpoint protection 9) Security awareness training 10) Regular penetration testing.'
        ]
      },
      // Network Security
      {
        patterns: ['what is network security', 'network security definition', 'network protection'],
        responses: [
          'Network security involves implementing measures to protect the integrity, confidentiality, and accessibility of computer networks and data. It includes both hardware and software technologies that defend against various cyber threats.',
          'Key aspects of network security: 1) Firewalls 2) VPNs 3) Intrusion Detection/Prevention Systems (IDS/IPS) 4) Network Access Control (NAC) 5) Email security 6) Web security 7) Wireless security 8) Network segmentation.'
        ]
      },
      {
        patterns: ['firewall types', 'types of firewalls', 'what is a firewall'],
        responses: [
          'Common firewall types: 1) Packet-filtering firewalls 2) Stateful inspection firewalls 3) Proxy firewalls 4) Next-generation firewalls (NGFW) 5) Web application firewalls (WAF) 6) Cloud firewalls 7) Unified threat management (UTM) firewalls.',
          'Firewalls can be categorized as: 1) Network-based (hardware) 2) Host-based (software) 3) Cloud-based. Each type offers different levels of protection and is suitable for different network architectures.'
        ]
      },
      {
        patterns: ['vpn security', 'what is vpn', 'virtual private network'],
        responses: [
          'A VPN (Virtual Private Network) creates a secure, encrypted connection over a less secure network, such as the internet. It provides: 1) Data encryption 2) IP address masking 3) Secure remote access 4) Bypassing geo-restrictions 5) Protection on public Wi-Fi.',
          'VPN protocols include: 1) OpenVPN 2) IPsec 3) L2TP/IPsec 4) SSTP 5) IKEv2 6) WireGuard. Each has different security features, speeds, and compatibility considerations.'
        ]
      },
      // Web Application Security
      // OWASP Top 10 (2021) - Comprehensive Coverage
      {
        patterns: ['owasp top 10', 'top 10 web vulnerabilities', 'owasp top 10 2021'],
        responses: [
          'OWASP Top 10 (2021) is the industry standard for web application security risks. The categories are: 1) Broken Access Control 2) Cryptographic Failures 3) Injection 4) Insecure Design 5) Security Misconfiguration 6) Vulnerable and Outdated Components 7) Identification and Authentication Failures 8) Software and Data Integrity Failures 9) Security Logging and Monitoring Failures 10) Server-Side Request Forgery (SSRF).',
          'OWASP Top 10 represents broad consensus about the most critical security risks to web applications. It helps organizations focus their security efforts on the most important areas. The list is updated every few years based on real-world data and security trends.'
        ]
      },
      // A01:2021 - Broken Access Control
      {
        patterns: ['broken access control', 'what is broken access control', 'owasp a01', 'authorization failures'],
        responses: [
          'Broken Access Control (OWASP A01:2021) occurs when users can access resources or perform actions they shouldn\'t be able to. Examples: 1) Bypassing access control checks 2) Modifying the URL 3) Elevation of privilege 4) Accessing API with missing CORS policy 5) Viewing or editing another user\'s account.',
          'Preventing Broken Access Control: 1) Implement proper authorization checks 2) Deny by default 3) Use access control lists (ACLs) 4) Log access control failures 5) Test access control mechanisms thoroughly 6) Implement proper session management 7) Use role-based access control (RBAC) or attribute-based access control (ABAC).'
        ]
      },
      // A02:2021 - Cryptographic Failures
      {
        patterns: ['cryptographic failures', 'sensitive data exposure', 'owasp a02', 'encryption failures'],
        responses: [
          'Cryptographic Failures (OWASP A02:2021) involve failures related to cryptography that expose sensitive data. Examples: 1) Weak or broken encryption algorithms 2) Poor key management 3) Hard-coded credentials 4) Transmitting data in clear text 5) Using deprecated hash functions (MD5, SHA1).',
          'Preventing Cryptographic Failures: 1) Use strong encryption (AES-256, RSA-2048+) 2) Use TLS 1.2+ with modern configurations 3) Hash and salt passwords (bcrypt, Argon2) 4) Never store unnecessary sensitive data 5) Disable legacy protocols (SSL, TLS 1.0/1.1) 6) Use secure random number generators 7) Implement proper key management.'
        ]
      },
      // A03:2021 - Injection
      {
        patterns: ['injection vulnerabilities', 'sql injection', 'command injection', 'owasp a03'],
        responses: [
          'Injection (OWASP A03:2021) occurs when untrusted data is sent to an interpreter as part of a command or query. Types: 1) SQL Injection 2) NoSQL Injection 3) Command Injection 4) LDAP Injection 5) XPath Injection 6) Server-Side Template Injection (SSTI).',
          'Preventing Injection: 1) Use parameterized queries 2) Use ORM frameworks 3) Input validation 4) Use safe APIs 5) Implement proper error handling 6) Use least privilege principle 7) Implement Web Application Firewall (WAF) 8) Regular security testing.'
        ]
      },
      // A04:2021 - Insecure Design
      {
        patterns: ['insecure design', 'security by design', 'owasp a04', 'security design flaws'],
        responses: [
          'Insecure Design (OWASP A04:2021) focuses on risks related to design and architectural flaws. Examples: 1) Missing security controls 2) Insecure workflows 3) Lack of threat modeling 4) Insecure default configurations 5) Missing security requirements.',
          'Preventing Insecure Design: 1) Implement secure design patterns 2) Use threat modeling 3) Define security requirements 4) Implement security by default 5) Use secure development lifecycle (SDLC) 6) Conduct design reviews 7) Implement proper error handling 8) Document security assumptions.'
        ]
      },
      // A05:2021 - Security Misconfiguration
      {
        patterns: ['security misconfiguration', 'owasp a05', 'server misconfiguration', 'insecure defaults'],
        responses: [
          'Security Misconfiguration (OWASP A05:2021) occurs when security settings are not properly configured. Examples: 1) Default accounts and passwords 2) Unnecessary features enabled 3) Outdated software 4) Verbose error messages 5) Improper HTTP headers 6) Unpatched systems.',
          'Preventing Security Misconfiguration: 1) Harden all systems 2) Remove unused features 3) Change default credentials 4) Disable directory listing 5) Implement proper error handling 6) Use security headers 7) Regular updates and patches 8) Automated scanning.'
        ]
      },
      // A06:2021 - Vulnerable and Outdated Components
      {
        patterns: ['vulnerable components', 'dependency vulnerabilities', 'owasp a06', 'outdated libraries'],
        responses: [
          'Vulnerable and Outdated Components (OWASP A06:2021) involves using components with known vulnerabilities. Examples: 1) Unpatched frameworks 2) Outdated libraries 3) Unsupported software 4) Missing security patches 5) Unmaintained dependencies.',
          'Managing Component Risks: 1) Maintain an inventory of components 2) Monitor for vulnerabilities 3) Subscribe to security bulletins 4) Use dependency checkers 5) Update regularly 6) Remove unused dependencies 7) Use trusted sources 8) Consider software composition analysis (SCA) tools.'
        ]
      },
      // A07:2021 - Identification and Authentication Failures
      {
        patterns: ['authentication failures', 'broken authentication', 'owasp a07', 'session management'],
        responses: [
          'Identification and Authentication Failures (OWASP A07:2021) occur when authentication mechanisms are implemented incorrectly. Examples: 1) Weak passwords 2) No MFA 3) Session fixation 4) Weak password recovery 5) Insecure session management 6) Credential stuffing.',
          'Preventing Authentication Failures: 1) Implement MFA 2) Enforce strong passwords 3) Secure session management 4) Implement account lockout 5) Use secure password reset 6) Log authentication attempts 7) Use secure protocols 8) Implement proper session timeouts.'
        ]
      },
      // A08:2021 - Software and Data Integrity Failures
      {
        patterns: ['data integrity failures', 'insecure deserialization', 'owasp a08', 'ci/cd security'],
        responses: [
          'Software and Data Integrity Failures (OWASP A08:2021) involve code and infrastructure that doesn\'t protect against integrity violations. Examples: 1) Insecure deserialization 2) Untrusted code execution 3) Malicious package uploads 4) Insecure CI/CD pipeline 5) Malicious updates.',
          'Preventing Integrity Failures: 1) Use digital signatures 2) Verify software integrity 3) Secure CI/CD pipeline 4) Implement code signing 5) Validate all inputs 6) Use secure deserialization 7) Implement dependency verification 8) Regular security audits.'
        ]
      },
      // A09:2021 - Security Logging and Monitoring Failures
      {
        patterns: ['logging failures', 'security monitoring', 'owasp a09', 'incident detection'],
        responses: [
          'Security Logging and Monitoring Failures (OWASP A09:2021) occur when security events are not properly logged or monitored. Examples: 1) Missing logs 2) Inadequate log storage 3) No alerting 4) Inadequate log analysis 5) No incident response plan 6) Log injection.',
          'Improving Logging and Monitoring: 1) Log security events 2) Protect log integrity 3) Centralized logging 4) Real-time monitoring 5) Set up alerts 6) Regular log reviews 7) Incident response plan 8) Test monitoring systems.'
        ]
      },
      // A10:2021 - Server-Side Request Forgery (SSRF)
      {
        patterns: ['ssrf', 'server-side request forgery', 'owasp a10', 'ssrf prevention'],
        responses: [
          'Server-Side Request Forgery (SSRF) (OWASP A10:2021) occurs when an attacker can make the server send requests to unintended locations. Examples: 1) Accessing internal services 2) Bypassing firewalls 3) Reading local files 4) Port scanning internal networks 5) Cloud metadata API abuse.',
          'Preventing SSRF: 1) Validate user input 2) Use allowlists 3) Disable URL schemas 4) Use network segmentation 5) Implement proper authentication 6) Use application-level firewalls 7) Disable unused protocols 8) Regular security testing.'
        ]
      },
      // General Web Application Security
      {
        patterns: ['what is web application security', 'web security basics', 'web app security'],
        responses: [
          'Web application security focuses on securing websites and online services against different security threats that exploit vulnerabilities in an application\'s code. It involves protecting the application from attacks like those in the OWASP Top 10.',
          'Key aspects of web security: 1) Secure coding practices 2) Input validation 3) Authentication & authorization 4) Session management 5) Data protection 6) Security headers 7) Regular security testing 8) Security monitoring and logging.'
        ]
      },
      {
        patterns: ['sql injection', 'what is sql injection', 'sql injection prevention'],
        responses: [
          'SQL injection is a code injection technique that might destroy your database. It occurs when an attacker can insert or manipulate SQL queries by providing malicious input. Prevention methods include: 1) Using parameterized queries 2) Stored procedures 3) Input validation 4) Least privilege principle 5) Web application firewall (WAF).',
          'Example of SQL injection: `SELECT * FROM users WHERE username = \'admin\' -- AND password = \'\'` The `--` comments out the password check, potentially allowing unauthorized access.'
        ]
      },
      {
        patterns: ['xss attack', 'cross site scripting', 'prevent xss'],
        responses: [
          'Cross-Site Scripting (XSS) is a security vulnerability that allows attackers to inject malicious scripts into web pages viewed by other users. Types: 1) Stored XSS 2) Reflected XSS 3) DOM-based XSS. Prevention: 1) Input validation 2) Output encoding 3) Content Security Policy (CSP) 4) Use secure frameworks 5) HttpOnly and Secure flags for cookies.',
          'Example of XSS: `<script>alert(\'XSS\')</script>` injected into a comment field that gets executed when other users view the page.'
        ]
      },
      // Cryptography & Encryption
      {
        patterns: ['what is cryptography', 'cryptography basics', 'encryption definition'],
        responses: [
          'Cryptography is the practice of securing information through techniques that transform data into a secure format. It provides: 1) Confidentiality 2) Integrity 3) Authentication 4) Non-repudiation. Main types: 1) Symmetric-key 2) Asymmetric-key 3) Hash functions.',
          'Modern cryptography includes: 1) Encryption algorithms (AES, RSA) 2) Digital signatures 3) Key exchange protocols 4) Hash functions (SHA-256) 5) Digital certificates 6) Public Key Infrastructure (PKI).'
        ]
      },
      {
        patterns: ['symmetric vs asymmetric encryption', 'difference between symmetric and asymmetric'],
        responses: [
          'Symmetric encryption uses a single key for both encryption and decryption (e.g., AES, DES). It\'s faster but requires secure key exchange. Asymmetric encryption uses a public/private key pair (e.g., RSA, ECC). The public key encrypts data, and the private key decrypts it, solving the key distribution problem.',
          'Symmetric: 1) Single shared key 2) Faster computation 3) Used for bulk encryption 4) Key distribution challenge. Asymmetric: 1) Key pairs (public/private) 2) Slower computation 3) Used for key exchange and digital signatures 4) Solves key distribution issue.'
        ]
      },
      {
        patterns: ['ssl tls explained', 'what is ssl', 'what is tls', 'https security'],
        responses: [
          'SSL (Secure Sockets Layer) and TLS (Transport Layer Security) are cryptographic protocols that provide secure communication over a computer network. TLS is the successor to SSL. They: 1) Encrypt data in transit 2) Authenticate the server 3) Ensure message integrity 4) Enable HTTPS for secure web browsing.',
          'TLS handshake process: 1) Client hello 2) Server hello and certificate 3) Key exchange 4) Start encryption. Modern best practices: 1) Use TLS 1.2 or 1.3 2) Disable older protocols (SSL 3.0, TLS 1.0/1.1) 3) Use strong cipher suites 4) Implement HSTS 5) Use valid certificates from trusted CAs.'
        ]
      },
      // Incident Response & Risk Management
      {
        patterns: ['incident response plan', 'cyber incident response', 'security incident management'],
        responses: [
          'An incident response plan outlines how to handle security breaches and cyber attacks. Key phases: 1) Preparation 2) Identification 3) Containment 4) Eradication 5) Recovery 6) Lessons learned. The goal is to minimize damage, reduce recovery time, and mitigate risks.',
          'Effective incident response requires: 1) Clear communication plan 2) Defined roles and responsibilities 3) Incident classification 4) Documentation procedures 5) Legal and regulatory considerations 6) Post-incident analysis and reporting.'
        ]
      },
      {
        patterns: ['risk management cybersecurity', 'security risk assessment', 'cyber risk framework'],
        responses: [
          'Cybersecurity risk management involves identifying, assessing, and mitigating risks to information systems. Key steps: 1) Asset identification 2) Threat assessment 3) Vulnerability assessment 4) Impact analysis 5) Risk treatment (avoid, transfer, mitigate, accept).',
          'Common risk management frameworks: 1) NIST Cybersecurity Framework 2) ISO 27005 3) FAIR 4) OCTAVE. These help organizations understand, manage, and communicate cybersecurity risks to stakeholders.'
        ]
      },
      {
        patterns: ['business continuity planning', 'disaster recovery', 'bcdr cybersecurity'],
        responses: [
          'Business Continuity (BC) and Disaster Recovery (DR) are essential components of cybersecurity. BC ensures critical business functions continue during disruption, while DR focuses on restoring IT infrastructure and operations after a disaster.',
          'Key DR metrics: 1) RTO (Recovery Time Objective) 2) RPO (Recovery Point Objective) 3) MTD (Maximum Tolerable Downtime). Regular testing, backups, and clear documentation are critical for effective BC/DR planning.'
        ]
      },
      // Penetration Testing
      {
        patterns: ['what is penetration testing', 'pen test definition', 'pentesting basics'],
        responses: [
          'Penetration testing (pen testing) is a simulated cyber attack against a computer system to check for exploitable vulnerabilities. Types: 1) Black Box 2) White Box 3) Gray Box 4) Web Application 5) Network 6) Social Engineering 7) Physical 8) Wireless 9) Cloud 10) Mobile.',
          'Pen testing phases: 1) Planning & Reconnaissance 2) Scanning 3) Gaining Access 4) Maintaining Access 5) Analysis & Reporting. Tools include: Metasploit, Nmap, Burp Suite, Wireshark, and John the Ripper.'
        ]
      },
      {
        patterns: ['owasp testing guide', 'web application penetration testing', 'web app security testing'],
        responses: [
          'Web application penetration testing focuses on identifying security vulnerabilities in web apps. OWASP Testing Guide covers: 1) Information Gathering 2) Configuration Management 3) Authentication Testing 4) Session Management 5) Authorization Testing 6) Data Validation 7) Business Logic 8) Client-Side Testing.',
          'Common web app vulnerabilities to test for: 1) Injection flaws 2) Broken Authentication 3) Sensitive Data Exposure 4) XML External Entities (XXE) 5) Broken Access Control 6) Security Misconfigurations 7) XSS 8) Insecure Deserialization 9) Using Components with Known Vulnerabilities 10) Insufficient Logging & Monitoring.'
        ]
      },
      
      // Security Operations (SecOps)
      {
        patterns: ['security operations center', 'what is soc', 'soc analyst'],
        responses: [
          'A Security Operations Center (SOC) is a centralized unit that deals with security issues on an organizational and technical level. Key functions: 1) Continuous monitoring 2) Incident response 3) Log management 4) Threat intelligence 5) Root cause analysis 6) Compliance management 7) Security awareness training.',
          'SOC team roles: 1) SOC Manager 2) Security Analysts (Tier 1-3) 3) Incident Responders 4) Threat Hunters 5) Forensic Investigators. Tools used: SIEM (Splunk, IBM QRadar), SOAR platforms, EDR solutions, and threat intelligence feeds.'
        ]
      },
      {
        patterns: ['siem tools', 'security information and event management', 'log management security'],
        responses: [
          'SIEM (Security Information and Event Management) solutions collect, analyze, and report on security-related data. Key features: 1) Log collection 2) Event correlation 3) Alerting 4) Dashboards 5) Incident response 6) Compliance reporting. Popular tools: Splunk, IBM QRadar, LogRhythm, ArcSight, and Microsoft Sentinel.',
          'SIEM benefits: 1) Real-time monitoring 2) Threat detection 3) Incident response 4) Forensic analysis 5) Compliance reporting. Implementation best practices: 1) Define use cases 2) Tune alerts 3) Integrate threat intelligence 4) Regular log source validation 5) Staff training.'
        ]
      },
      
      // Threat Hunting & Intelligence
      {
        patterns: ['threat hunting', 'what is threat hunting', 'proactive threat detection'],
        responses: [
          'Threat hunting is the proactive search for cyber threats that evade existing security solutions. Approaches: 1) Hypothesis-driven 2) Indicator of Compromise (IoC) based 3) Analytics-driven 4) Situational awareness. The process: 1) Trigger 2) Investigation 3) Resolution 4) Documentation.',
          'Threat hunting techniques: 1) Process analysis 2) Memory analysis 3) Network traffic analysis 4) Endpoint behavior analysis 5) File analysis. Tools: Sysinternals, Volatility, Wireshark, YARA, and MITRE ATT&CK framework for TTPs (Tactics, Techniques, and Procedures).'
        ]
      },
      {
        patterns: ['threat intelligence', 'cyber threat intelligence', 'threat feeds'],
        responses: [
          'Cyber Threat Intelligence (CTI) is evidence-based knowledge about existing or emerging threats. Types: 1) Strategic 2) Tactical 3) Operational 4) Technical. Sources: 1) Open Source Intelligence (OSINT) 2) Commercial feeds 3) Information Sharing and Analysis Centers (ISACs) 4) Dark web monitoring.',
          'Threat intelligence lifecycle: 1) Planning & Direction 2) Collection 3) Processing 4) Analysis 5) Dissemination 6) Feedback. Benefits: 1) Proactive defense 2) Faster incident response 3) Better risk management 4) Improved security posture 5) Regulatory compliance.'
        ]
      },
      
      // Cloud & Container Security
      {
        patterns: ['cloud security best practices', 'aws azure security', 'cloud security architecture'],
        responses: [
          'Cloud security best practices: 1) Shared Responsibility Model 2) Identity and Access Management (IAM) 3) Data encryption 4) Network security 5) Logging and monitoring 6) Vulnerability management 7) Secure configurations 8) Incident response planning 9) Compliance management 10) Regular security assessments.',
          'Cloud security tools: 1) CSPM (Cloud Security Posture Management) 2) CWPP (Cloud Workload Protection Platform) 3) CASB (Cloud Access Security Broker) 4) SASE (Secure Access Service Edge) 5) CSP-native security tools (AWS Security Hub, Azure Security Center, Google Cloud Security Command Center).'
        ]
      },
      {
        patterns: ['container security', 'docker security', 'kubernetes security'],
        responses: [
          'Container security best practices: 1) Use minimal base images 2) Scan for vulnerabilities 3) Sign and verify images 4) Least privilege principle 5) Network segmentation 6) Runtime protection 7) Secrets management 8) Immutable containers 9) Regular updates 10) Runtime security monitoring.',
          'Kubernetes security considerations: 1) RBAC (Role-Based Access Control) 2) Network policies 3) Pod Security Policies 4) Image scanning 5) Runtime security 6) API server security 7) etcd encryption 8) Audit logging 9) Admission controllers 10) Service mesh security (e.g., Istio, Linkerd).'
        ]
      },
      
      // IoT & OT Security
      {
        patterns: ['iot security', 'internet of things security', 'iot vulnerabilities'],
        responses: [
          'IoT security challenges: 1) Weak authentication 2) Insecure communication 3) Lack of encryption 4) Vulnerable interfaces 5) Insecure software/firmware 6) Poor physical security 7) Lack of visibility 8) Supply chain risks 9) Insecure default settings 10) Lack of update mechanisms.',
          'IoT security best practices: 1) Change default credentials 2) Regular firmware updates 3) Network segmentation 4) Disable unnecessary services 5) Implement strong authentication 6) Encrypt communications 7) Physical security 8) Regular security assessments 9) Vendor security assessments 10) Monitor for anomalies.'
        ]
      },
      {
        patterns: ['ics security', 'scada security', 'operational technology security'],
        responses: [
          'ICS/OT security focuses on protecting industrial control systems. Key concerns: 1) Legacy systems 2) Long lifecycles 3) Availability requirements 4) Proprietary protocols 5) Physical safety implications 6) Air-gapped networks 7) Supply chain risks 8) Lack of security features 9) Remote access requirements 10) Regulatory compliance.',
          'OT security frameworks: 1) IEC 62443 2) NIST SP 800-82 3) NERC CIP 4) ISA/IEC 62443. Best practices: 1) Network segmentation 2) Patch management 3) Access control 4) Network monitoring 5) Asset inventory 6) Change management 7) Incident response planning 8) Security awareness training 9) Vendor security 10) Regular security assessments.'
        ]
      },
      
      // Security Compliance & Frameworks
      {
        patterns: ['security compliance standards', 'gdpr hipaa soc 2', 'security frameworks'],
        responses: [
          'Major security compliance standards: 1) GDPR (General Data Protection Regulation) 2) HIPAA (Health Insurance Portability and Accountability Act) 3) SOC 2 (Service Organization Control) 4) ISO 27001 5) PCI DSS (Payment Card Industry Data Security Standard) 6) NIST CSF 7) CIS Controls 8) FedRAMP 9) CMMC 10) SOX (Sarbanes-Oxley).',
          'Implementing security frameworks: 1) Risk assessment 2) Gap analysis 3) Policy development 4) Control implementation 5) Training & awareness 6) Continuous monitoring 7) Regular audits 8) Incident response planning 9) Vendor management 10) Documentation & evidence collection.'
        ]
      },
      
      {
        patterns: ["what is TestTrust","what is TestTrust?","what is this","what is this?","what is this platform","what is this platform?","what is it","what is it?",'what is it for','what is it for?','what is it used for','what is it used for?','what is it used for?','what is it used for?', 'what is testtrust key features','what is test trust key features', 'what is test trust key features?','what are test trust key features?','what are testtrust key features?','what are test trust key features?'],
        responses:["TestTrust is an examination platform that helps Instructors create and manage exams, including question banks for previous archived exams, exam scheduling, and student performance tracking."]
      },
    
    ];

    // Check for matches in knowledge base
    for (const item of knowledgeBase) {
      if (item.patterns.some(pattern => lowerInput.includes(pattern))) {
        // Return a random response from the matching item
        return item.responses[Math.floor(Math.random() * item.responses.length)];
      }
    }
    
    // Default response if no match found
    const defaultResponses = [
      "I'm not sure I understand. Could you rephrase your question?",
      "I'm still learning! Could you ask that in a different way?",
      "I'm here to help with TestTrust. Could you clarify your question?",
      "I'm not sure about that. Could you ask me something about creating exams, adding questions, or viewing results?",
      "I'm not familier with that question please try a different way of asking and if it didnt work please contact the developers and notify them with the requested questions and they will surely add it for the next update"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    // Add user message
    const userMessage = { 
      text: input, 
      sender: 'user',
      timestamp: new Date(),
      isLoading: false
    };
    
    // Add loading indicator
    const loadingMessage = { 
      text: 'Thinking...', 
      sender: 'bot',
      timestamp: new Date(),
      isLoading: true
    };
    
    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate API call with timeout
    setTimeout(() => {
      const botResponse = getBotResponse(input);
      
      // Remove loading message and add bot response
      setMessages(prev => [
        ...prev.filter(m => !m.isLoading),
        {
          text: botResponse,
          sender: 'bot',
          timestamp: new Date(),
          isLoading: false
        }
      ]);
      
      setIsTyping(false);
    }, 500);
  };

  const toggleChat = () => {
    if (isOpen) {
      setIsClosing(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
      }, 300); // Match this with the animation duration
    } else {
      setIsOpen(true);
    }
  };

  // Format time for messages
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ChatBotContainer>
      {isOpen && (
        <ChatWindow elevation={3} isClosing={isClosing}>
          <ChatHeader>
            <Box display="flex" alignItems="center">
              <img 
                src={botImage} 
                alt="Chatbot" 
                style={{
                  width: '24px',
                  height: '24px',
                  marginRight: '8px',
                  objectFit: 'contain'
                }} 
              />
              <Typography variant="subtitle1">TestTrust Assistant</Typography>
            </Box>
            <IconButton size="small" onClick={toggleChat} style={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </ChatHeader>
          <ChatMessages>
            {messages.map((message, index) => (
              <Box 
                key={index} 
                display="flex" 
                flexDirection="column" 
                alignItems={message.sender === 'user' ? 'flex-end' : 'flex-start'}
                mb={1}
                width="100%"
              >
                <MessageBubble className={message.sender}>
                  {message.isLoading ? (
                    <Box display="flex" alignItems="center">
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      <Typography variant="body2">{message.text}</Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2">{message.text}</Typography>
                  )}
                  <Typography 
                    variant="caption" 
                    color="textSecondary" 
                    sx={{ 
                      display: 'block', 
                      textAlign: 'right',
                      mt: 0.5,
                      fontSize: '0.7rem'
                    }}
                  >
                    {formatTime(new Date(message.timestamp))}
                    {message.sender === 'bot' && !message.isLoading && (
                      <img 
                        src={botImage} 
                        alt="" 
                        style={{
                          width: '14px',
                          height: '14px',
                          marginLeft: '4px',
                          verticalAlign: 'middle',
                          display: 'inline-block'
                        }} 
                      />
                    )}
                  </Typography>
                </MessageBubble>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </ChatMessages>
          <ChatInput onSubmit={handleSend}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              sx={{ mr: 1 }}
              autoComplete="off"
            />
            <IconButton 
              type="submit" 
              color="primary" 
              disabled={!input.trim()}
            >
              <SendIcon />
            </IconButton>
          </ChatInput>
        </ChatWindow>
      )}
      <BotButton 
        onClick={toggleChat}
        sx={{
          backgroundColor: isOpen ? '#f50057' : 'transparent',
          padding: '8px',
          '&:hover': {
            backgroundColor: isOpen ? '#c51162' : 'rgba(25, 118, 210, 0.1)',
            transform: 'scale(1.1)'
          },
          transition: 'all 0.3s ease-in-out'
        }}
      >
        {isOpen ? (
          <CloseIcon sx={{ fontSize: 30, color: 'white' }} />
        ) : (
          <img 
            src={botImage} 
            alt="Chatbot" 
            style={{
              width: '32px',
              height: '32px',
              objectFit: 'contain'
            }} 
          />
        )}
      </BotButton>
    </ChatBotContainer>
  );
};

export default ChatBot;
