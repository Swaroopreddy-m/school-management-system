const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');

// Require School User authentication
router.use(authenticate(['SCHOOL_USER']));

// RBAC check helper for school sub-roles
const checkSubRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.schoolUserRole)) {
      return res.status(403).json({ message: 'Access denied: Insufficient role permissions.' });
    }
    next();
  };
};

// ==========================================
// 1. STUDENTS MODULE
// ==========================================

// Get all students inside school
router.get('/students', async (req, res) => {
  try {
    const students = await prisma.schoolUser.findMany({
      where: {
        schoolId: req.user.schoolId,
        role: 'STUDENT'
      },
      include: {
        studentProfile: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({ message: 'Error fetching students.' });
  }
});

// Register student user + profile
router.post('/students', checkSubRole(['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER']), async (req, res) => {
  try {
    const { name, email, username, password, rollNumber, grade, section, parentName, parentPhone } = req.body;

    if (!name || !email || !username || !password || !rollNumber || !grade || !section) {
      return res.status(400).json({ message: 'All student details and credentials are required.' });
    }

    // Check username uniqueness within this school
    const existing = await prisma.schoolUser.findUnique({
      where: {
        schoolId_username: {
          schoolId: req.user.schoolId,
          username: username.toLowerCase()
        }
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'Username is already taken in this school.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.schoolUser.create({
        data: {
          schoolId: req.user.schoolId,
          name,
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          passwordHash,
          role: 'STUDENT'
        }
      });

      const profile = await tx.studentProfile.create({
        data: {
          userId: user.id,
          rollNumber,
          grade,
          section,
          parentName,
          parentPhone
        }
      });

      return { user, profile };
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorName: req.user.name,
        actorType: 'SCHOOL_USER',
        action: 'STUDENT_REGISTERED',
        details: `Registered student "${name}" (Roll: ${rollNumber}, Grade: ${grade})`,
        ipAddress: req.ip
      }
    });

    return res.status(201).json(student.user);
  } catch (error) {
    console.error('Error registering student:', error);
    return res.status(500).json({ message: 'Error registering student.' });
  }
});

// ==========================================
// 2. TEACHERS MODULE
// ==========================================

// Get all teachers inside school
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await prisma.schoolUser.findMany({
      where: {
        schoolId: req.user.schoolId,
        role: 'TEACHER'
      },
      include: {
        teacherProfile: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return res.status(500).json({ message: 'Error fetching teachers.' });
  }
});

// Register teacher user + profile
router.post('/teachers', checkSubRole(['SCHOOL_ADMIN']), async (req, res) => {
  try {
    const { name, email, username, password, employeeId, subject, qualification } = req.body;

    if (!name || !email || !username || !password || !employeeId || !subject) {
      return res.status(400).json({ message: 'All teacher details and credentials are required.' });
    }

    const existing = await prisma.schoolUser.findUnique({
      where: {
        schoolId_username: {
          schoolId: req.user.schoolId,
          username: username.toLowerCase()
        }
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'Username is already taken in this school.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const teacher = await prisma.$transaction(async (tx) => {
      const user = await tx.schoolUser.create({
        data: {
          schoolId: req.user.schoolId,
          name,
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          passwordHash,
          role: 'TEACHER'
        }
      });

      const profile = await tx.teacherProfile.create({
        data: {
          userId: user.id,
          employeeId,
          subject,
          qualification
        }
      });

      return { user, profile };
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorName: req.user.name,
        actorType: 'SCHOOL_USER',
        action: 'TEACHER_REGISTERED',
        details: `Registered teacher "${name}" (Subject: ${subject})`,
        ipAddress: req.ip
      }
    });

    return res.status(201).json(teacher.user);
  } catch (error) {
    console.error('Error registering teacher:', error);
    return res.status(500).json({ message: 'Error registering teacher.' });
  }
});

// ==========================================
// 3. ATTENDANCE MODULE
// ==========================================

// Get attendance logs
router.get('/attendance', async (req, res) => {
  try {
    const whereClause = { schoolId: req.user.schoolId };
    if (['STUDENT', 'PARENT'].includes(req.user.schoolUserRole)) {
      whereClause.studentId = req.user.id;
    }
    const logs = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          select: { name: true, username: true }
        }
      },
      orderBy: { date: 'desc' }
    });
    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving attendance logs.' });
  }
});

// Mark student attendance
router.post('/attendance', checkSubRole(['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER']), async (req, res) => {
  try {
    const { studentId, date, status, remarks } = req.body;

    if (!studentId || !date || !status) {
      return res.status(400).json({ message: 'Student ID, Date, and Attendance Status are required.' });
    }

    // Verify student belongs to this school
    const student = await prisma.schoolUser.findFirst({
      where: { id: studentId, schoolId: req.user.schoolId, role: 'STUDENT' }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found in this school.' });
    }

    // Upsert attendance for date/student
    const record = await prisma.attendance.upsert({
      where: {
        studentId_date: { studentId, date }
      },
      update: { status, remarks },
      create: {
        schoolId: req.user.schoolId,
        studentId,
        date,
        status,
        remarks
      }
    });

    return res.json(record);
  } catch (error) {
    console.error('Error marking attendance:', error);
    return res.status(500).json({ message: 'Error saving attendance record.' });
  }
});

// ==========================================
// 4. EXAMS MODULE
// ==========================================

// Get all exams
router.get('/exams', async (req, res) => {
  try {
    const whereClause = { schoolId: req.user.schoolId };
    let exams;
    if (req.user.schoolUserRole === 'STUDENT') {
      exams = await prisma.exam.findMany({
        where: whereClause,
        include: {
          results: {
            where: { studentId: req.user.id }
          }
        },
        orderBy: { examDate: 'desc' }
      });
    } else {
      exams = await prisma.exam.findMany({
        where: whereClause,
        orderBy: { examDate: 'desc' }
      });
    }
    return res.json(exams);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching exams.' });
  }
});

// Create exam
router.post('/exams', checkSubRole(['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER']), async (req, res) => {
  try {
    const { examName, subject, maxMarks, examDate } = req.body;

    if (!examName || !subject || !maxMarks || !examDate) {
      return res.status(400).json({ message: 'All exam details are required.' });
    }

    const exam = await prisma.exam.create({
      data: {
        schoolId: req.user.schoolId,
        examName,
        subject,
        maxMarks: parseInt(maxMarks, 10),
        examDate
      }
    });

    return res.status(201).json(exam);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating exam.' });
  }
});

// Get results for an exam
router.get('/exams/:examId/results', async (req, res) => {
  try {
    const results = await prisma.examResult.findMany({
      where: {
        examId: req.params.examId,
        exam: { schoolId: req.user.schoolId }
      },
      include: {
        student: {
          select: { name: true, username: true }
        }
      }
    });
    return res.json(results);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching exam results.' });
  }
});

// Post student score for an exam
router.post('/exams/:examId/results', checkSubRole(['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER']), async (req, res) => {
  try {
    const { examId } = req.params;
    const { studentId, marksObtained, grade, remarks } = req.body;

    if (!studentId || marksObtained === undefined) {
      return res.status(400).json({ message: 'Student ID and marks are required.' });
    }

    // Verify student and exam belong to this school
    const student = await prisma.schoolUser.findFirst({
      where: { id: studentId, schoolId: req.user.schoolId, role: 'STUDENT' }
    });
    const exam = await prisma.exam.findFirst({
      where: { id: examId, schoolId: req.user.schoolId }
    });

    if (!student || !exam) {
      return res.status(404).json({ message: 'Student or Exam context is invalid.' });
    }

    const score = await prisma.examResult.upsert({
      where: {
        examId_studentId: { examId, studentId }
      },
      update: { marksObtained: parseFloat(marksObtained), grade, remarks },
      create: {
        examId,
        studentId,
        marksObtained: parseFloat(marksObtained),
        grade,
        remarks
      }
    });

    return res.json(score);
  } catch (error) {
    console.error('Error posting exam result:', error);
    return res.status(500).json({ message: 'Error saving score.' });
  }
});

// ==========================================
// 5. FEES MODULE
// ==========================================

// Get fee invoices
router.get('/fees', async (req, res) => {
  try {
    const whereClause = { schoolId: req.user.schoolId };
    if (req.user.schoolUserRole === 'STUDENT') {
      whereClause.studentId = req.user.id;
    }
    const invoices = await prisma.feeInvoice.findMany({
      where: whereClause,
      include: {
        student: {
          select: { name: true, username: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(invoices);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving invoices.' });
  }
});

// Issue invoice
router.post('/fees', checkSubRole(['SCHOOL_ADMIN', 'ACCOUNTANT']), async (req, res) => {
  try {
    const { studentId, amount, dueDate } = req.body;

    if (!studentId || !amount || !dueDate) {
      return res.status(400).json({ message: 'Student, billing amount, and due date are required.' });
    }

    // Verify student belongs to this school
    const student = await prisma.schoolUser.findFirst({
      where: { id: studentId, schoolId: req.user.schoolId, role: 'STUDENT' }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found in this school.' });
    }

    const invoice = await prisma.feeInvoice.create({
      data: {
        schoolId: req.user.schoolId,
        studentId,
        amount: parseFloat(amount),
        dueDate,
        status: 'UNPAID'
      }
    });

    return res.status(201).json(invoice);
  } catch (error) {
    return res.status(500).json({ message: 'Error generating invoice.' });
  }
});

// Record fee payment
router.put('/fees/:id/pay', checkSubRole(['SCHOOL_ADMIN', 'ACCOUNTANT', 'STUDENT']), async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const invoice = await prisma.feeInvoice.findFirst({
      where: { id, schoolId: req.user.schoolId }
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found or access denied.' });
    }

    // Security: Students can only pay their own invoices
    if (req.user.schoolUserRole === 'STUDENT' && invoice.studentId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You can only pay your own invoices.' });
    }

    const updated = await prisma.feeInvoice.update({
      where: { id },
      data: {
        status: 'PAID',
        paymentMethod: paymentMethod || 'CASH',
        paymentDate: new Date().toISOString().split('T')[0]
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(500).json({ message: 'Error processing fee payment.' });
  }
});

// ==========================================
// 6. LIBRARY MODULE
// ==========================================

// Get library catalogue
router.get('/books', async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      where: { schoolId: req.user.schoolId },
      orderBy: { title: 'asc' }
    });
    return res.json(books);
  } catch (error) {
    return res.status(500).json({ message: 'Error loading catalog.' });
  }
});

// Add book to catalog
router.post('/books', checkSubRole(['SCHOOL_ADMIN', 'LIBRARIAN']), async (req, res) => {
  try {
    const { title, author, isbn, quantity } = req.body;

    if (!title || !author || quantity === undefined) {
      return res.status(400).json({ message: 'Title, Author, and Total Quantity are required.' });
    }

    const qty = parseInt(quantity, 10);

    const book = await prisma.book.create({
      data: {
        schoolId: req.user.schoolId,
        title,
        author,
        isbn,
        quantity: qty,
        available: qty
      }
    });

    return res.status(201).json(book);
  } catch (error) {
    return res.status(500).json({ message: 'Error adding book.' });
  }
});

// Get active checkouts
router.get('/books/issues', async (req, res) => {
  try {
    const whereClause = {};
    if (req.user.schoolUserRole === 'STUDENT') {
      whereClause.studentId = req.user.id;
    } else {
      whereClause.book = { schoolId: req.user.schoolId };
    }
    const issues = await prisma.bookIssue.findMany({
      where: whereClause,
      include: {
        book: { select: { title: true, author: true } },
        student: { select: { name: true, username: true } }
      },
      orderBy: { issueDate: 'desc' }
    });
    return res.json(issues);
  } catch (error) {
    return res.status(500).json({ message: 'Error loading checkouts.' });
  }
});

// Issue book
router.post('/books/:bookId/issue', checkSubRole(['SCHOOL_ADMIN', 'LIBRARIAN']), async (req, res) => {
  try {
    const { bookId } = req.params;
    const { studentId, issueDate } = req.body;

    if (!studentId || !issueDate) {
      return res.status(400).json({ message: 'Student ID and Issue Date are required.' });
    }

    const student = await prisma.schoolUser.findFirst({
      where: { id: studentId, schoolId: req.user.schoolId, role: 'STUDENT' }
    });

    const book = await prisma.book.findFirst({
      where: { id: bookId, schoolId: req.user.schoolId }
    });

    if (!student || !book) {
      return res.status(404).json({ message: 'Student or Book not found.' });
    }

    if (book.available <= 0) {
      return res.status(400).json({ message: 'This book is currently out of stock.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create issue
      const issue = await tx.bookIssue.create({
        data: {
          bookId,
          studentId,
          issueDate,
          status: 'ISSUED'
        }
      });

      // Decrement availability
      await tx.book.update({
        where: { id: bookId },
        data: { available: book.available - 1 }
      });

      return issue;
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Error issuing book:', error);
    return res.status(500).json({ message: 'Error issuing book.' });
  }
});

// Return book
router.put('/books/issue/:id/return', checkSubRole(['SCHOOL_ADMIN', 'LIBRARIAN']), async (req, res) => {
  try {
    const { id } = req.params;
    const returnDate = new Date().toISOString().split('T')[0];

    const issue = await prisma.bookIssue.findUnique({
      where: { id },
      include: { book: true }
    });

    if (!issue || issue.book.schoolId !== req.user.schoolId) {
      return res.status(404).json({ message: 'Checkout record not found.' });
    }

    if (issue.status === 'RETURNED') {
      return res.status(400).json({ message: 'Book has already been returned.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedIssue = await tx.bookIssue.update({
        where: { id },
        data: { status: 'RETURNED', returnDate }
      });

      await tx.book.update({
        where: { id: issue.bookId },
        data: { available: issue.book.available + 1 }
      });

      return updatedIssue;
    });

    return res.json(result);
  } catch (error) {
    console.error('Error returning book:', error);
    return res.status(500).json({ message: 'Error returning book.' });
  }
});

module.exports = router;
