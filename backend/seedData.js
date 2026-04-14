require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Organizer = require('./models/Organizer');
const Participant = require('./models/Participant');
const Event = require('./models/Event');
const Registration = require('./models/Registration');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://Mahanth2107:YbYCY2AFOixzPu4j@cluster0.b1qr3.mongodb.net/event_management?retryWrites=true&w=majority')
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => console.log('MongoDB connection error:', err));

// Sample data
const seedData = async () => {
  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await Admin.deleteMany({});
    await Organizer.deleteMany({});
    await Participant.deleteMany({});
    await Event.deleteMany({});
    await Registration.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create Admin
    console.log('\n📌 Creating Admin account...');
    const admin = await Admin.create({
      email: 'admin@felicity.iiit.ac.in',
      password: 'admin123',
      role: 'SuperAdmin'
    });
    console.log('✅ Admin created - Email: admin@felicity.iiit.ac.in, Password: admin123');

    // Create Organizers (Real IIIT Clubs)
    console.log('\n📌 Creating Organizers (Real IIIT Clubs)...');
    const organizers = await Organizer.create([
      {
        organizerName: 'Programming Club',
        email: 'programming.club@iiit.ac.in',
        password: 'prog123',
        category: 'Technical',
        description: 'Competitive programming, algorithm discussions, and coding competitions. We organize regular contests, workshops, and training sessions.',
        contactEmail: 'programming.club@iiit.ac.in',
        isApproved: true
      },
      {
        organizerName: '0x1337: The Hacking Club',
        email: 'hacking.club@iiit.ac.in',
        password: 'hack123',
        category: 'Technical',
        description: 'Exploiting vulnerabilities for fun and teaching about security in today\'s world. We conduct CTF competitions and security workshops.',
        contactEmail: 'hacking.club@iiit.ac.in',
        isApproved: true
      },
      {
        organizerName: 'The Gaming Club',
        email: 'thegamingclub@iiit.ac.in',
        password: 'gaming123',
        category: 'Sports',
        description: 'For Gamers By IIITians - organizing gaming tournaments, esports events, and casual gaming sessions.',
        contactEmail: 'thegamingclub@iiit.ac.in',
        isApproved: true
      },
      {
        organizerName: 'Open-Source Developers Group',
        email: 'osdg@iiit.ac.in',
        password: 'osdg123',
        category: 'Technical',
        description: 'Promoting open-source culture and development. We organize hackathons, workshops on modern tech stacks, and contribute to open-source projects.',
        contactEmail: 'osdg@iiit.ac.in',
        isApproved: true
      },
      {
        organizerName: 'The Language Club',
        email: 'thelanguageclub@iiit.ac.in',
        password: 'lang123',
        category: 'Cultural',
        description: 'Exploring languages, literature, and linguistic challenges. From classical texts to modern AI language models.',
        contactEmail: 'thelanguageclub@iiit.ac.in',
        isApproved: true
      },
      {
        organizerName: 'Astronautics Club',
        email: 'astronauticsclub@iiit.ac.in',
        password: 'astro123',
        category: 'Academic',
        description: 'Exploring astronomy, space science, and astrophysics. Regular theory sessions, star-gazing events, and research discussions.',
        contactEmail: 'astronauticsclub@iiit.ac.in',
        isApproved: true
      },
      {
        organizerName: 'E-Cell IIIT Hyderabad',
        email: 'ecell@iiit.ac.in',
        password: 'ecell123',
        category: 'Technical',
        description: 'Entrepreneurship Cell established with the objective of creating, manifesting and guiding the entrepreneurial spirit in the student community.',
        contactEmail: 'ecell@iiit.ac.in',
        isApproved: true
      },
      {
        organizerName: 'The Music Club',
        email: 'themusicclub@iiit.ac.in',
        password: 'music123',
        category: 'Cultural',
        description: 'Because without music, life would B flat. Promoting musical talent and organizing cultural events, jam sessions, and concerts.',
        contactEmail: 'themusicclub@iiit.ac.in',
        isApproved: true
      },
      {
        organizerName: 'Electronics and Robotics Club',
        email: 'roboticsclub@iiit.ac.in',
        password: 'robo123',
        category: 'Technical',
        description: 'Building autonomous robots, drones, and hardware projects. We organize workshops, competitions, and collaborative build sessions.',
        contactEmail: 'roboticsclub@iiit.ac.in',
        isApproved: true
      },
      {
        organizerName: 'Clubs Council',
        email: 'clubs@iiit.ac.in',
        password: 'clubs123',
        category: 'Social',
        description: 'The governing body coordinating all club activities at IIIT Hyderabad. We organize inter-club events and campus-wide activities.',
        contactEmail: 'clubs@iiit.ac.in',
        isApproved: true
      },
      {
        organizerName: 'The Art Society',
        email: 'artsociety@iiit.ac.in',
        password: 'art123',
        category: 'Cultural',
        description: 'Painting, sketching, digital art, and creative expression workshops. Express yourself through various art forms.',
        contactEmail: 'artsociety@iiit.ac.in',
        isApproved: true
      },
      {
        organizerName: 'Debating Society',
        email: 'debsoc@iiit.ac.in',
        password: 'debate123',
        category: 'Social',
        description: 'Parliamentary debates, Model UN, and public speaking events at IIIT-H. Sharpen your argumentation and rhetoric skills.',
        contactEmail: 'debsoc@iiit.ac.in',
        isApproved: true
      }
    ]);
    console.log(`✅ ${organizers.length} Organizers created`);

    // Create Participants
    console.log('\n📌 Creating Participants...');
    const participants = await Participant.create([
      // IIIT Students
      {
        firstName: 'Aarav',
        lastName: 'Sharma',
        email: 'aarav.sharma@students.iiit.ac.in',
        password: 'aarav123',
        participantType: 'Student',
        collegeName: 'IIIT Hyderabad',
        organizationName: 'IIIT Hyderabad',
        contactNumber: '9876543210',
        isIIITStudent: true,
        interests: ['Technical', 'Academic'],
        followedClubs: [organizers[0]._id, organizers[1]._id, organizers[3]._id],
        hasCompletedOnboarding: true,
        preferences: {
          eventType: ['Technical', 'Academic'],
          sortBy: 'date'
        }
      },
      {
        firstName: 'Priya',
        lastName: 'Patel',
        email: 'priya.patel@students.iiit.ac.in',
        password: 'priya123',
        participantType: 'Student',
        collegeName: 'IIIT Hyderabad',
        organizationName: 'IIIT Hyderabad',
        contactNumber: '9876543211',
        isIIITStudent: true,
        interests: ['Cultural', 'Social'],
        followedClubs: [organizers[4]._id, organizers[7]._id, organizers[10]._id],
        hasCompletedOnboarding: true,
        preferences: {
          eventType: ['Cultural'],
          sortBy: 'popularity'
        }
      },
      {
        firstName: 'Arjun',
        lastName: 'Reddy',
        email: 'arjun.reddy@students.iiit.ac.in',
        password: 'arjun123',
        participantType: 'Student',
        collegeName: 'IIIT Hyderabad',
        organizationName: 'IIIT Hyderabad',
        contactNumber: '9876543212',
        isIIITStudent: true,
        interests: ['Sports', 'Technical'],
        followedClubs: [organizers[2]._id, organizers[0]._id],
        hasCompletedOnboarding: true,
        preferences: {
          eventType: ['Sports'],
          sortBy: 'date'
        }
      },
      {
        firstName: 'Meera',
        lastName: 'Krishnan',
        email: 'meera.krishnan@students.iiit.ac.in',
        password: 'meera123',
        participantType: 'Student',
        collegeName: 'IIIT Hyderabad',
        organizationName: 'IIIT Hyderabad',
        contactNumber: '9876543215',
        isIIITStudent: true,
        interests: ['Academic', 'Cultural'],
        followedClubs: [organizers[5]._id, organizers[4]._id],
        hasCompletedOnboarding: true,
        preferences: {
          eventType: ['Academic', 'Cultural'],
          sortBy: 'date'
        }
      },
      // Non-IIIT Participants
      {
        firstName: 'Sneha',
        lastName: 'Kumar',
        email: 'sneha.kumar@gmail.com',
        password: 'sneha123',
        participantType: 'Student',
        collegeName: 'NIT Warangal',
        organizationName: 'NIT Warangal',
        contactNumber: '9876543213',
        isIIITStudent: false,
        interests: ['Technical', 'Sports'],
        followedClubs: [organizers[0]._id, organizers[3]._id],
        hasCompletedOnboarding: true,
        preferences: {
          eventType: ['Technical', 'Sports'],
          sortBy: 'date'
        }
      },
      {
        firstName: 'Vikram',
        lastName: 'Singh',
        email: 'vikram.singh@outlook.com',
        password: 'vikram123',
        participantType: 'Professional',
        collegeName: 'IIT Delhi',
        organizationName: 'Tech Mahindra',
        contactNumber: '9876543214',
        isIIITStudent: false,
        interests: ['Technical'],
        followedClubs: [organizers[1]._id, organizers[3]._id],
        hasCompletedOnboarding: true,
        preferences: {
          eventType: ['Technical'],
          sortBy: 'relevance'
        }
      },
      {
        firstName: 'Ananya',
        lastName: 'Gupta',
        email: 'ananya.gupta@yahoo.com',
        password: 'ananya123',
        participantType: 'Student',
        collegeName: 'Osmania University',
        organizationName: 'Osmania University',
        contactNumber: '9876543216',
        isIIITStudent: false,
        interests: ['Cultural', 'Social'],
        followedClubs: [organizers[7]._id, organizers[10]._id],
        hasCompletedOnboarding: true,
        preferences: {
          eventType: ['Cultural'],
          sortBy: 'date'
        }
      },
      {
        firstName: 'Rohan',
        lastName: 'Verma',
        email: 'rohan.verma@students.iiit.ac.in',
        password: 'rohan123',
        participantType: 'Student',
        collegeName: 'IIIT Hyderabad',
        organizationName: 'IIIT Hyderabad',
        contactNumber: '9876543217',
        isIIITStudent: true,
        interests: ['Technical', 'Sports'],
        followedClubs: [organizers[8]._id, organizers[2]._id, organizers[9]._id],
        hasCompletedOnboarding: true,
        preferences: {
          eventType: ['Technical', 'Sports'],
          sortBy: 'date'
        }
      }
    ]);
    console.log(`✅ ${participants.length} Participants created`);

    // Create Events - Mix of Upcoming and Completed
    console.log('\n📌 Creating Events...');
    const today = new Date();
    const futureDate1 = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week from now
    const futureDate2 = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks from now
    const futureDate3 = new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000); // 3 weeks from now
    const futureDate4 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 1 month from now
    const pastDate1 = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); // 1 week ago
    const pastDate2 = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000); // 2 weeks ago
    const pastDate3 = new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000); // 3 weeks ago

    const events = await Event.create([
      // ==================== UPCOMING EVENTS ====================
      
      // 1. HackIIIT 2026 (Upcoming)
      {
        eventName: 'HackIIIT 2026',
        description: 'OSDG Annual Hackathon focused on solving real campus problems using code. Build anything that improves life at IIIT. Prize pool of ₹1,00,000 powered by Jane Street Asia.',
        eventType: 'Normal',
        organizerId: organizers[3]._id, // OSDG
        eventStartDate: futureDate2,
        eventEndDate: new Date(futureDate2.getTime() + 27 * 60 * 60 * 1000), // 27 hours
        registrationDeadline: new Date(futureDate2.getTime() - 3 * 24 * 60 * 60 * 1000),
        registrationFee: 0,
        registrationLimit: 150,
        currentRegistrations: 87,
        eligibility: 'UG 1, UG 2, UG 3, UG 4+, PG',
        eventTags: ['Hackathon', 'Programming', 'Innovation', 'Open Source'],
        venue: 'Himalaya 105',
        status: 'Published',
        customForm: {
          fields: [
            {
              fieldName: 'Team Size',
              fieldType: 'dropdown',
              required: true,
              options: ['1', '2', '3', '4']
            },
            {
              fieldName: 'Project Idea (Brief)',
              fieldType: 'text',
              required: true
            },
            {
              fieldName: 'Tech Stack (Preferred)',
              fieldType: 'text',
              required: false
            }
          ]
        }
      },

      // 2. Competitive Programming Workshop
      {
        eventName: 'Advanced Meet: Graph Algorithms',
        description: 'Deep dive into advanced graph algorithms including Maximum Flow, Minimum Cut, and Network Flow problems. Session by Programming Club.',
        eventType: 'Normal',
        organizerId: organizers[0]._id, // Programming Club
        eventStartDate: futureDate1,
        eventEndDate: new Date(futureDate1.getTime() + 3 * 60 * 60 * 1000),
        registrationDeadline: new Date(futureDate1.getTime() - 2 * 24 * 60 * 60 * 1000),
        registrationFee: 0,
        registrationLimit: 80,
        currentRegistrations: 56,
        eligibility: 'UG 1, UG 2, UG 3, UG 4+, PG',
        eventTags: ['Competitive Programming', 'Algorithms', 'Workshop'],
        venue: 'Himalaya 104',
        status: 'Published',
        customForm: {
          fields: [
            {
              fieldName: 'Codeforces Handle',
              fieldType: 'text',
              required: false
            },
            {
              fieldName: 'Experience Level',
              fieldType: 'dropdown',
              required: true,
              options: ['Beginner', 'Intermediate', 'Advanced']
            }
          ]
        }
      },

      // 3. Cryptography Workshop
      {
        eventName: 'Intro To Cryptography & CTF Challenge',
        description: 'An event introducing students to cryptography and its applications in cybersecurity - how it works and how to break it. Prizes worth up to ₹2500 for solving the challenges!',
        eventType: 'Normal',
        organizerId: organizers[1]._id, // Hacking Club
        eventStartDate: futureDate1,
        eventEndDate: new Date(futureDate1.getTime() + 2 * 60 * 60 * 1000),
        registrationDeadline: new Date(futureDate1.getTime() - 1 * 24 * 60 * 60 * 1000),
        registrationFee: 0,
        registrationLimit: 100,
        currentRegistrations: 73,
        eligibility: 'UG 1, UG 2, UG 3, UG 4+, PG',
        eventTags: ['Cryptography', 'CTF', 'Security', 'Hacking'],
        venue: 'Himalaya 103',
        status: 'Published',
        customForm: {
          fields: [
            {
              fieldName: 'Prior CTF Experience',
              fieldType: 'dropdown',
              required: true,
              options: ['None', 'Beginner', 'Intermediate', 'Advanced']
            },
            {
              fieldName: 'Team or Solo',
              fieldType: 'dropdown',
              required: true,
              options: ['Solo', 'Team of 2', 'Team of 3']
            }
          ]
        }
      },

      // 4. Gaming Tournament
      {
        eventName: 'BGMI Championship 2026',
        description: 'We have partnered with Krafton for a BGMI tournament with a prize pool sponsored by Krafton. Battle it out for glory and prizes!',
        eventType: 'Normal',
        organizerId: organizers[2]._id, // Gaming Club
        eventStartDate: futureDate3,
        eventEndDate: new Date(futureDate3.getTime() + 30 * 60 * 60 * 1000), // 2 days
        registrationDeadline: new Date(futureDate3.getTime() - 5 * 24 * 60 * 60 * 1000),
        registrationFee: 200,
        registrationLimit: 64,
        currentRegistrations: 42,
        eligibility: 'UG 1, UG 2, UG 3, UG 4+, PG',
        eventTags: ['Gaming', 'BGMI', 'Esports', 'Tournament'],
        venue: 'Himalaya 203',
        status: 'Published',
        customForm: {
          fields: [
            {
              fieldName: 'Team Name',
              fieldType: 'text',
              required: true
            },
            {
              fieldName: 'Team Captain IGN',
              fieldType: 'text',
              required: true
            },
            {
              fieldName: 'Team Members IGN (4)',
              fieldType: 'text',
              required: true
            },
            {
              fieldName: 'Average Tier',
              fieldType: 'dropdown',
              required: true,
              options: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crown', 'Ace']
            }
          ]
        }
      },

      // 5. Language Club Event
      {
        eventName: 'AI Prompt Engineering Challenge',
        description: 'Complete a series of creative tasks using legacy LLM versions based on particular constraints (ex. fewest words in prompt, limitation on what can be in the prompt, etc.)',
        eventType: 'Normal',
        organizerId: organizers[4]._id, // Language Club
        eventStartDate: futureDate2,
        eventEndDate: new Date(futureDate2.getTime() + 2 * 60 * 60 * 1000),
        registrationDeadline: new Date(futureDate2.getTime() - 2 * 24 * 60 * 60 * 1000),
        registrationFee: 0,
        registrationLimit: 60,
        currentRegistrations: 34,
        eligibility: 'UG 1, UG 2, UG 3, UG 4+, PG',
        eventTags: ['AI', 'Language', 'Challenge', 'LLM'],
        venue: 'Himalaya 103',
        status: 'Published',
        customForm: {
          fields: [
            {
              fieldName: 'Experience with AI Tools',
              fieldType: 'dropdown',
              required: true,
              options: ['None', 'Beginner', 'Intermediate', 'Expert']
            }
          ]
        }
      },

      // 6. Astronomy Session
      {
        eventName: 'Astronomy Theory: Black Holes & Event Horizons',
        description: 'Comprehensive theory session on black holes, event horizons, and gravitational phenomena. Interactive Q&A and telescope observation session.',
        eventType: 'Normal',
        organizerId: organizers[5]._id, // Astronautics Club
        eventStartDate: futureDate1,
        eventEndDate: new Date(futureDate1.getTime() + 3 * 60 * 60 * 1000),
        registrationDeadline: new Date(futureDate1.getTime() - 1 * 24 * 60 * 60 * 1000),
        registrationFee: 0,
        registrationLimit: 50,
        currentRegistrations: 38,
        eligibility: 'UG 1, UG 2, UG 3, UG 4+, PG, Faculty, Staff',
        eventTags: ['Astronomy', 'Theory', 'Space', 'Physics'],
        venue: 'Vindhya SH2',
        status: 'Published',
        customForm: {
          fields: [
            {
              fieldName: 'Background in Physics',
              fieldType: 'dropdown',
              required: true,
              options: ['High School', 'Undergraduate', 'Graduate', 'Self-taught']
            }
          ]
        }
      },

      // 7. Startup Pitch Event
      {
        eventName: 'E-Summit 2026: Startup Pitch Competition',
        description: 'Present your startup idea to industry experts and investors. Winner gets funding opportunities and mentorship from leading entrepreneurs.',
        eventType: 'Normal',
        organizerId: organizers[6]._id, // E-Cell
        eventStartDate: futureDate4,
        eventEndDate: new Date(futureDate4.getTime() + 6 * 60 * 60 * 1000),
        registrationDeadline: new Date(futureDate4.getTime() - 7 * 24 * 60 * 60 * 1000),
        registrationFee: 300,
        registrationLimit: 40,
        currentRegistrations: 28,
        eligibility: 'Open to all students and professionals',
        eventTags: ['Entrepreneurship', 'Startup', 'Pitch', 'Business'],
        venue: 'Nilgiri Auditorium',
        status: 'Published',
        customForm: {
          fields: [
            {
              fieldName: 'Startup Name',
              fieldType: 'text',
              required: true
            },
            {
              fieldName: 'Team Size',
              fieldType: 'dropdown',
              required: true,
              options: ['1', '2', '3', '4', '5+']
            },
            {
              fieldName: 'Startup Brief (100 words)',
              fieldType: 'text',
              required: true
            },
            {
              fieldName: 'Pitch Deck',
              fieldType: 'file',
              required: true
            }
          ]
        }
      },

      // 8. Robotics Competition
      {
        eventName: 'RoboWars 2026',
        description: 'Design and build autonomous robots to compete in combat challenges. Show off your engineering and programming skills.',
        eventType: 'Normal',
        organizerId: organizers[8]._id, // Robotics Club
        eventStartDate: futureDate3,
        eventEndDate: new Date(futureDate3.getTime() + 8 * 60 * 60 * 1000),
        registrationDeadline: new Date(futureDate3.getTime() - 10 * 24 * 60 * 60 * 1000),
        registrationFee: 500,
        registrationLimit: 30,
        currentRegistrations: 18,
        eligibility: 'Engineering students',
        eventTags: ['Robotics', 'Competition', 'Engineering', 'Hardware'],
        venue: 'Felicity Ground',
        status: 'Published',
        customForm: {
          fields: [
            {
              fieldName: 'Team Name',
              fieldType: 'text',
              required: true
            },
            {
              fieldName: 'Robot Category',
              fieldType: 'dropdown',
              required: true,
              options: ['Lightweight', 'Middleweight', 'Heavyweight']
            },
            {
              fieldName: 'Team Members (Max 4)',
              fieldType: 'text',
              required: true
            }
          ]
        }
      },

      // 9. Music Festival
      {
        eventName: 'Raaga 2026 - Annual Music Fest',
        description: 'Showcase your musical talent at the biggest music event of the year. Solo, band, and duet performances welcome.',
        eventType: 'Normal',
        organizerId: organizers[7]._id, // Music Club
        eventStartDate: futureDate4,
        eventEndDate: new Date(futureDate4.getTime() + 6 * 60 * 60 * 1000),
        registrationDeadline: new Date(futureDate4.getTime() - 5 * 24 * 60 * 60 * 1000),
        registrationFee: 150,
        registrationLimit: 100,
        currentRegistrations: 67,
        eligibility: 'Open to all',
        eventTags: ['Music', 'Performance', 'Festival', 'Cultural'],
        venue: 'OAT (Open Air Theatre)',
        status: 'Published',
        customForm: {
          fields: [
            {
              fieldName: 'Performance Category',
              fieldType: 'dropdown',
              required: true,
              options: ['Solo Vocal', 'Solo Instrumental', 'Band', 'Duet']
            },
            {
              fieldName: 'Song/Composition Name',
              fieldType: 'text',
              required: true
            },
            {
              fieldName: 'Duration (minutes)',
              fieldType: 'dropdown',
              required: true,
              options: ['3-5', '5-7', '7-10']
            },
            {
              fieldName: 'Audio Track (if required)',
              fieldType: 'file',
              required: false
            }
          ]
        }
      },

      // ==================== MERCHANDISE EVENT ====================
      
      // 10. Felicity 2026 Official Merchandise
      {
        eventName: 'Felicity 2026 Official Merchandise',
        description: 'Get your exclusive Felicity 2026 merchandise - T-shirts, Hoodies, Caps, and more! Limited stock available. Show your college pride!',
        eventType: 'Merchandise',
        organizerId: organizers[9]._id, // Clubs Council
        eventStartDate: today,
        eventEndDate: futureDate4,
        registrationDeadline: new Date(futureDate4.getTime() - 3 * 24 * 60 * 60 * 1000),
        registrationFee: 0,
        registrationLimit: 500,
        currentRegistrations: 156,
        eligibility: 'Open to all',
        eventTags: ['Merchandise', 'Felicity', 'Shopping', 'Apparel'],
        venue: 'Student Activity Center',
        status: 'Ongoing',
        merchandise: {
          items: [
            {
              itemName: 'Felicity 2026 T-Shirt',
              size: ['S', 'M', 'L', 'XL', 'XXL'],
              color: ['Black', 'White', 'Navy Blue', 'Maroon'],
              quantity: 400,
              pricePerItem: 399,
              maxPurchasePerParticipant: 3
            },
            {
              itemName: 'Felicity 2026 Hoodie',
              size: ['M', 'L', 'XL', 'XXL'],
              color: ['Black', 'Grey', 'Navy Blue'],
              quantity: 200,
              pricePerItem: 899,
              maxPurchasePerParticipant: 2
            },
            {
              itemName: 'Felicity 2026 Cap',
              size: ['Free Size'],
              color: ['Black', 'Red', 'White', 'Blue'],
              quantity: 250,
              pricePerItem: 249,
              maxPurchasePerParticipant: 2
            },
            {
              itemName: 'Felicity 2026 Water Bottle',
              size: ['500ml'],
              color: ['Silver', 'Black'],
              quantity: 300,
              pricePerItem: 349,
              maxPurchasePerParticipant: 2
            },
            {
              itemName: 'Felicity 2026 Tote Bag',
              size: ['Standard'],
              color: ['Beige', 'Black'],
              quantity: 150,
              pricePerItem: 299,
              maxPurchasePerParticipant: 2
            }
          ]
        }
      },

      // ==================== COMPLETED EVENTS ====================
      
      // 11. Past IICPC Codefest
      {
        eventName: 'IICPC Codefest Prelims',
        description: 'Prelims of IICPC Codefest. The event was conducted with invigilators and participants were spaced out during the contest.',
        eventType: 'Normal',
        organizerId: organizers[0]._id, // Programming Club
        eventStartDate: pastDate2,
        eventEndDate: new Date(pastDate2.getTime() + 6 * 60 * 60 * 1000),
        registrationDeadline: new Date(pastDate2.getTime() - 3 * 24 * 60 * 60 * 1000),
        registrationFee: 0,
        registrationLimit: 200,
        currentRegistrations: 187,
        eligibility: 'UG 1, UG 2, UG 3, UG 4+',
        eventTags: ['Competitive Programming', 'ICPC', 'Contest'],
        venue: 'Himalaya 301, 302, 303, 304, 104',
        status: 'Completed',
        customForm: {
          fields: [
            {
              fieldName: 'Codeforces Rating',
              fieldType: 'text',
              required: false
            }
          ]
        }
      },

      // 12. Past DevOps Workshop
      {
        eventName: 'Thinking Beyond Code: The DevOps Mindset',
        description: 'Introduction to DevOps, Docker and Kubernetes. Hands-on workshop with practical examples.',
        eventType: 'Normal',
        organizerId: organizers[3]._id, // OSDG
        eventStartDate: pastDate3,
        eventEndDate: new Date(pastDate3.getTime() + 3 * 60 * 60 * 1000),
        registrationDeadline: new Date(pastDate3.getTime() - 2 * 24 * 60 * 60 * 1000),
        registrationFee: 0,
        registrationLimit: 100,
        currentRegistrations: 92,
        eligibility: 'UG 1, UG 2, UG 3, UG 4+, PG',
        eventTags: ['DevOps', 'Docker', 'Kubernetes', 'Workshop'],
        venue: 'Himalaya 105',
        status: 'Completed'
      },

      // 13. Past Cubing Event
      {
        eventName: 'Scrambled - Cubing Championship',
        description: 'Rubik\'s cube solving competition with multiple categories. Speedcubing at its best!',
        eventType: 'Normal',
        organizerId: organizers[9]._id, // Clubs Council
        eventStartDate: pastDate3,
        eventEndDate: new Date(pastDate3.getTime() + 2 * 60 * 60 * 1000),
        registrationDeadline: new Date(pastDate3.getTime() - 2 * 24 * 60 * 60 * 1000),
        registrationFee: 50,
        registrationLimit: 50,
        currentRegistrations: 47,
        eligibility: 'UG 1, UG 2, UG 3, UG 4+, PG',
        eventTags: ['Cubing', 'Speedcubing', 'Competition', 'Sports'],
        venue: 'Himalaya 104',
        status: 'Completed'
      },

      // 14. Past Astronomy Session
      {
        eventName: 'Astronomy Theory: Gravitational Lensing',
        description: 'Theory session discussing Gravitational Lensing and its applications in modern astronomy.',
        eventType: 'Normal',
        organizerId: organizers[5]._id, // Astronautics Club
        eventStartDate: pastDate2,
        eventEndDate: new Date(pastDate2.getTime() + 2 * 60 * 60 * 1000),
        registrationDeadline: new Date(pastDate2.getTime() - 1 * 24 * 60 * 60 * 1000),
        registrationFee: 0,
        registrationLimit: 40,
        currentRegistrations: 35,
        eligibility: 'UG 1, UG 2, UG 3, UG 4+, PG, Faculty, Staff',
        eventTags: ['Astronomy', 'Theory', 'Physics'],
        venue: 'Vindhya SH2',
        status: 'Completed'
      },

      // 15. Past Art Workshop
      {
        eventName: 'Felicity Banner Painting Workshop',
        description: 'Collaborative art session for creating banners and posters for Felicity 2026.',
        eventType: 'Normal',
        organizerId: organizers[10]._id, // Art Society
        eventStartDate: pastDate3,
        eventEndDate: new Date(pastDate3.getTime() + 3 * 60 * 60 * 1000),
        registrationDeadline: new Date(pastDate3.getTime() - 1 * 24 * 60 * 60 * 1000),
        registrationFee: 0,
        registrationLimit: 30,
        currentRegistrations: 28,
        eligibility: 'Open to all',
        eventTags: ['Art', 'Painting', 'Workshop', 'Felicity'],
        venue: 'Art Studio',
        status: 'Completed'
      }
    ]);
    console.log(`✅ ${events.length} Events created`);

    // Create Registrations
    console.log('\n📌 Creating Registrations...');
    const registrations = await Registration.create([
      // Registrations for HackIIIT 2026 (Upcoming)
      {
        participantId: participants[0]._id, // Aarav
        eventId: events[0]._id,
        status: 'Registered',
        formResponses: {
          'Team Size': '3',
          'Project Idea (Brief)': 'A campus navigation app with AR integration',
          'Tech Stack (Preferred)': 'React Native, ARCore, Node.js'
        },
        ticketId: 'TKT-HACK26-001',
        qrCode: 'QR-HACK26-001',
        teamName: 'Code Crusaders',
        teamMembers: [
          { name: 'Aarav Sharma', email: 'aarav.sharma@students.iiit.ac.in', rollNumber: 'UG1-2024-001' },
          { name: 'Rohan Verma', email: 'rohan.verma@students.iiit.ac.in', rollNumber: 'UG2-2023-045' },
          { name: 'Meera Krishnan', email: 'meera.krishnan@students.iiit.ac.in', rollNumber: 'UG2-2023-078' }
        ],
        paymentStatus: 'Completed'
      },
      {
        participantId: participants[4]._id, // Sneha
        eventId: events[0]._id,
        status: 'Registered',
        formResponses: {
          'Team Size': '2',
          'Project Idea (Brief)': 'Automated mess menu suggestions based on dietary preferences',
          'Tech Stack (Preferred)': 'Python, Flask, React'
        },
        ticketId: 'TKT-HACK26-002',
        qrCode: 'QR-HACK26-002',
        teamName: 'Tech Ninjas',
        teamMembers: [
          { name: 'Sneha Kumar', email: 'sneha.kumar@gmail.com', rollNumber: 'EXT-001' },
          { name: 'Vikram Singh', email: 'vikram.singh@outlook.com', rollNumber: 'EXT-002' }
        ],
        paymentStatus: 'Completed'
      },

      // Registrations for Graph Algorithms Workshop
      {
        participantId: participants[0]._id, // Aarav
        eventId: events[1]._id,
        status: 'Registered',
        formResponses: {
          'Codeforces Handle': 'aarav_codes',
          'Experience Level': 'Intermediate'
        },
        ticketId: 'TKT-GRAPH-001',
        qrCode: 'QR-GRAPH-001',
        paymentStatus: 'Completed'
      },
      {
        participantId: participants[2]._id, // Arjun
        eventId: events[1]._id,
        status: 'Registered',
        formResponses: {
          'Codeforces Handle': 'arjun_cp',
          'Experience Level': 'Advanced'
        },
        ticketId: 'TKT-GRAPH-002',
        qrCode: 'QR-GRAPH-002',
        paymentStatus: 'Completed'
      },

      // Registrations for Cryptography Workshop
      {
        participantId: participants[5]._id, // Vikram
        eventId: events[2]._id,
        status: 'Registered',
        formResponses: {
          'Prior CTF Experience': 'Intermediate',
          'Team or Solo': 'Solo'
        },
        ticketId: 'TKT-CRYPTO-001',
        qrCode: 'QR-CRYPTO-001',
        paymentStatus: 'Completed'
      },

      // Registrations for BGMI Championship
      {
        participantId: participants[2]._id, // Arjun
        eventId: events[3]._id,
        status: 'Registered',
        formResponses: {
          'Team Name': 'Godlike Squad',
          'Team Captain IGN': 'ArjunGG',
          'Team Members IGN (4)': 'ArjunGG, PlayerX, ProGamer, SniperKing',
          'Average Tier': 'Crown'
        },
        ticketId: 'TKT-BGMI-001',
        qrCode: 'QR-BGMI-001',
        teamName: 'Godlike Squad',
        paymentStatus: 'Completed'
      },

      // Registration for Music Fest
      {
        participantId: participants[1]._id, // Priya
        eventId: events[8]._id,
        status: 'Registered',
        formResponses: {
          'Performance Category': 'Solo Vocal',
          'Song/Composition Name': 'Tum Hi Ho',
          'Duration (minutes)': '5-7'
        },
        ticketId: 'TKT-RAAGA-001',
        qrCode: 'QR-RAAGA-001',
        paymentStatus: 'Completed'
      },
      {
        participantId: participants[6]._id, // Ananya
        eventId: events[8]._id,
        status: 'Registered',
        formResponses: {
          'Performance Category': 'Duet',
          'Song/Composition Name': 'Kun Faya Kun',
          'Duration (minutes)': '7-10'
        },
        ticketId: 'TKT-RAAGA-002',
        qrCode: 'QR-RAAGA-002',
        paymentStatus: 'Completed'
      },

      // Merchandise Purchases
      {
        participantId: participants[0]._id, // Aarav
        eventId: events[9]._id,
        status: 'Completed',
        merchandisePurchase: {
          items: [
            {
              itemId: 'merch1',
              quantity: 2,
              selectedSize: 'L',
              selectedColor: 'Black'
            },
            {
              itemId: 'merch5',
              quantity: 1,
              selectedSize: 'Standard',
              selectedColor: 'Black'
            }
          ],
          totalAmount: 1097,
          paymentStatus: 'Completed'
        },
        ticketId: 'TKT-MERCH-001',
        qrCode: 'QR-MERCH-001',
        paymentStatus: 'Completed'
      },
      {
        participantId: participants[2]._id, // Arjun
        eventId: events[9]._id,
        status: 'Registered',
        merchandisePurchase: {
          items: [
            {
              itemId: 'merch1',
              quantity: 1,
              selectedSize: 'M',
              selectedColor: 'White'
            },
            {
              itemId: 'merch3',
              quantity: 1,
              selectedSize: 'Free Size',
              selectedColor: 'Black'
            }
          ],
          totalAmount: 648,
          paymentStatus: 'Pending'
        },
        ticketId: 'TKT-MERCH-002',
        qrCode: 'QR-MERCH-002',
        paymentStatus: 'Pending'
      },
      {
        participantId: participants[1]._id, // Priya
        eventId: events[9]._id,
        status: 'Completed',
        merchandisePurchase: {
          items: [
            {
              itemId: 'merch2',
              quantity: 1,
              selectedSize: 'M',
              selectedColor: 'Grey'
            }
          ],
          totalAmount: 899,
          paymentStatus: 'Completed'
        },
        ticketId: 'TKT-MERCH-003',
        qrCode: 'QR-MERCH-003',
        paymentStatus: 'Completed'
      },

      // Completed event registrations
      {
        participantId: participants[0]._id, // Aarav
        eventId: events[10]._id, // IICPC Codefest
        status: 'Completed',
        formResponses: {
          'Codeforces Rating': '1547'
        },
        ticketId: 'TKT-ICPC-001',
        qrCode: 'QR-ICPC-001',
        paymentStatus: 'Completed'
      },
      {
        participantId: participants[4]._id, // Sneha
        eventId: events[10]._id,
        status: 'Completed',
        formResponses: {
          'Codeforces Rating': '1234'
        },
        ticketId: 'TKT-ICPC-002',
        qrCode: 'QR-ICPC-002',
        paymentStatus: 'Completed'
      },
      {
        participantId: participants[5]._id, // Vikram
        eventId: events[11]._id, // DevOps Workshop
        status: 'Completed',
        ticketId: 'TKT-DEVOPS-001',
        qrCode: 'QR-DEVOPS-001',
        paymentStatus: 'Completed'
      },
      {
        participantId: participants[3]._id, // Meera
        eventId: events[13]._id, // Gravitational Lensing
        status: 'Completed',
        formResponses: {
          'Background in Physics': 'Undergraduate'
        },
        ticketId: 'TKT-ASTRO-001',
        qrCode: 'QR-ASTRO-001',
        paymentStatus: 'Completed'
      },
      {
        participantId: participants[1]._id, // Priya
        eventId: events[14]._id, // Art Workshop
        status: 'Completed',
        ticketId: 'TKT-ART-001',
        qrCode: 'QR-ART-001',
        paymentStatus: 'Completed'
      },
      {
        participantId: participants[6]._id, // Ananya
        eventId: events[14]._id,
        status: 'Completed',
        ticketId: 'TKT-ART-002',
        qrCode: 'QR-ART-002',
        paymentStatus: 'Completed'
      },
      
      // Some cancelled registrations
      {
        participantId: participants[7]._id, // Rohan
        eventId: events[12]._id, // Cubing Event
        status: 'Cancelled',
        ticketId: 'TKT-CUBE-001',
        qrCode: 'QR-CUBE-001',
        paymentStatus: 'Completed'
      }
    ]);
    console.log(`✅ ${registrations.length} Registrations created`);

    // Update followers for organizers
    await Organizer.findByIdAndUpdate(organizers[0]._id, {
      $push: { followers: { $each: [participants[0]._id, participants[2]._id, participants[4]._id] } }
    });
    await Organizer.findByIdAndUpdate(organizers[1]._id, {
      $push: { followers: { $each: [participants[0]._id, participants[5]._id] } }
    });
    await Organizer.findByIdAndUpdate(organizers[2]._id, {
      $push: { followers: { $each: [participants[2]._id, participants[7]._id] } }
    });
    await Organizer.findByIdAndUpdate(organizers[3]._id, {
      $push: { followers: { $each: [participants[0]._id, participants[4]._id, participants[5]._id] } }
    });
    await Organizer.findByIdAndUpdate(organizers[4]._id, {
      $push: { followers: { $each: [participants[1]._id, participants[3]._id] } }
    });
    await Organizer.findByIdAndUpdate(organizers[5]._id, {
      $push: { followers: { $each: [participants[3]._id] } }
    });
    await Organizer.findByIdAndUpdate(organizers[7]._id, {
      $push: { followers: { $each: [participants[1]._id, participants[6]._id] } }
    });
    await Organizer.findByIdAndUpdate(organizers[8]._id, {
      $push: { followers: { $each: [participants[7]._id] } }
    });
    await Organizer.findByIdAndUpdate(organizers[9]._id, {
      $push: { followers: { $each: [participants[7]._id] } }
    });
    await Organizer.findByIdAndUpdate(organizers[10]._id, {
      $push: { followers: { $each: [participants[1]._id, participants[6]._id] } }
    });

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('\n📊 Summary:');
    console.log(`   • Admins: 1`);
    console.log(`   • Organizers (Real IIIT Clubs): ${organizers.length}`);
    console.log(`   • Participants: ${participants.length}`);
    console.log(`   • Events: ${events.length} (${events.filter(e => e.status === 'Published').length} Published, ${events.filter(e => e.status === 'Completed').length} Completed, ${events.filter(e => e.status === 'Ongoing').length} Ongoing)`);
    console.log(`   • Registrations: ${registrations.length}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('\n   ADMIN:');
    console.log('   Email: admin@felicity.iiit.ac.in');
    console.log('   Password: admin123');
    
    console.log('\n   ORGANIZERS (Sample):');
    organizers.slice(0, 5).forEach(org => {
      const password = org.email.split('@')[0].replace('.', '').replace('0x1337:', 'hack') + '123';
      console.log(`   ${org.organizerName}: ${org.email} / Password: ${password}`);
    });
    
    console.log('\n   PARTICIPANTS (Sample):');
    participants.slice(0, 4).forEach(part => {
      console.log(`   ${part.firstName} ${part.lastName}: ${part.email} / Password: ${part.firstName.toLowerCase()}123`);
    });
    
    console.log('\n📅 Event Distribution:');
    console.log(`   • Upcoming Events: ${events.filter(e => e.status === 'Published' || e.status === 'Ongoing').length}`);
    console.log(`   • Completed Events: ${events.filter(e => e.status === 'Completed').length}`);
    console.log(`   • Normal Events: ${events.filter(e => e.eventType === 'Normal').length}`);
    console.log(`   • Merchandise Events: ${events.filter(e => e.eventType === 'Merchandise').length}`);
    
    console.log('\n' + '='.repeat(70));
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedData();
