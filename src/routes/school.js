const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { sendEmail } = require('../utils/mailer');

// Helper to find parent's associated student user ID
const getParentStudentId = async (req) => {
  if (req.user.schoolUserRole !== 'PARENT') return null;
  const profile = await prisma.studentProfile.findFirst({
    where: {
      parentName: {
        contains: req.user.name
      }
    }
  });
  return profile ? profile.userId : 'non-existent-id';
};

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

// Dynamic Permissions Check Middleware
const checkPermission = (requiredMenu) => {
  return async (req, res, next) => {
    try {
      const role = req.user.schoolUserRole;
      if (!role) {
        return res.status(403).json({ message: 'Access denied: Role context missing.' });
      }

      // SCHOOL_ADMIN always has full access to all tabs/modules
      if (role === 'SCHOOL_ADMIN') return next();

      // Look up permissions for this school and role
      const perm = await prisma.rolePermission.findUnique({
        where: {
          schoolId_roleName: {
            schoolId: req.user.schoolId,
            roleName: role
          }
        }
      });

      const defaultMappings = {
        PRINCIPAL: ['Dashboard', 'Students', 'Teachers', 'Attendance', 'Exams', 'Library'],
        VICE_PRINCIPAL: ['Dashboard', 'Students', 'Teachers', 'Attendance', 'Exams', 'Library'],
        TEACHER: ['Dashboard', 'Students', 'Attendance', 'Exams'],
        STUDENT: ['Dashboard', 'Exams', 'Fees', 'Library'],
        PARENT: ['Dashboard', 'Fees', 'Exams'],
        ACCOUNTANT: ['Dashboard', 'Fees'],
        LIBRARIAN: ['Dashboard', 'Library'],
        RECEPTIONIST: ['Dashboard', 'Visitors']
      };

      let enabledMenus = [];
      if (perm) {
        enabledMenus = perm.menus.split(',');
      } else if (defaultMappings[role]) {
        enabledMenus = defaultMappings[role];
        // Proactively seed this mapping in the background so it exists in database
        await prisma.rolePermission.create({
          data: {
            schoolId: req.user.schoolId,
            roleName: role,
            menus: enabledMenus.join(',')
          }
        }).catch(err => console.error('Error auto-seeding permissions:', err));
      }

      if (enabledMenus.includes(requiredMenu)) {
        return next();
      }

      return res.status(403).json({ message: `Access denied: Your role "${role}" does not have access to the "${requiredMenu}" module.` });
    } catch (error) {
      console.error('Error checking permissions:', error);
      return res.status(500).json({ message: 'Internal server error checking permissions.' });
    }
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
router.post('/students', checkPermission('Students'), async (req, res) => {
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
router.post('/teachers', checkPermission('Teachers'), async (req, res) => {
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
    const parentStudentId = await getParentStudentId(req);
    const whereClause = { schoolId: req.user.schoolId };
    if (req.user.schoolUserRole === 'STUDENT') {
      whereClause.studentId = req.user.id;
    } else if (parentStudentId) {
      whereClause.studentId = parentStudentId;
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

// Mark attendance log
router.post('/attendance', checkPermission('Attendance'), async (req, res) => {
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
    const parentStudentId = await getParentStudentId(req);
    const whereClause = { schoolId: req.user.schoolId };
    let exams;
    if (req.user.schoolUserRole === 'STUDENT' || parentStudentId) {
      const targetStudentId = parentStudentId || req.user.id;
      exams = await prisma.exam.findMany({
        where: whereClause,
        include: {
          results: {
            where: { studentId: targetStudentId }
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
router.post('/exams', checkPermission('Exams'), async (req, res) => {
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
router.post('/exams/:examId/results', checkPermission('Exams'), async (req, res) => {
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

    // Trigger exam grade notification email
    const studentUser = await prisma.schoolUser.findUnique({ where: { id: studentId } });
    const examObj = await prisma.exam.findUnique({ where: { id: examId } });
    if (studentUser && examObj) {
      await sendEmail({
        to: studentUser.email,
        subject: `Exam Grade Published - ${examObj.examName}`,
        html: `
          <h3>Academic Grade Alert</h3>
          <p>Dear ${studentUser.name},</p>
          <p>Your grade for the exam <strong>${examObj.examName}</strong> (${examObj.subject}) has been published:</p>
          <ul>
            <li><strong>Marks Obtained:</strong> ${marksObtained} / ${examObj.maxMarks}</li>
            <li><strong>Grade:</strong> ${grade || 'N/A'}</li>
            <li><strong>Feedback:</strong> ${remarks || 'None'}</li>
          </ul>
          <p>Please log in to your portal to view details.</p>
        `
      }).catch(err => console.error('Error emailing grade alert:', err));
    }

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
    const parentStudentId = await getParentStudentId(req);
    const whereClause = { schoolId: req.user.schoolId };
    if (req.user.schoolUserRole === 'STUDENT') {
      whereClause.studentId = req.user.id;
    } else if (parentStudentId) {
      whereClause.studentId = parentStudentId;
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
router.post('/fees', checkPermission('Fees'), async (req, res) => {
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

    // Trigger invoice email notification
    const studentUser = await prisma.schoolUser.findUnique({ where: { id: studentId } });
    if (studentUser) {
      await sendEmail({
        to: studentUser.email,
        subject: `Billing Invoice Issued - #${invoice.id.substring(0, 8)}`,
        html: `
          <h3>New Invoice Generated</h3>
          <p>Dear ${studentUser.name},</p>
          <p>A new invoice has been generated for your account:</p>
          <ul>
            <li><strong>Invoice ID:</strong> #${invoice.id.substring(0, 8)}</li>
            <li><strong>Amount Due:</strong> $${invoice.amount.toFixed(2)}</li>
            <li><strong>Due Date:</strong> ${invoice.dueDate}</li>
          </ul>
          <p>Please log in to pay online or visit the billing desk.</p>
        `
      }).catch(err => console.error('Error emailing invoice alert:', err));
    }

    return res.status(201).json(invoice);
  } catch (error) {
    return res.status(500).json({ message: 'Error generating invoice.' });
  }
});

// Record fee payment
router.put('/fees/:id/pay', checkSubRole(['SCHOOL_ADMIN', 'ACCOUNTANT', 'STUDENT', 'PARENT']), async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const invoice = await prisma.feeInvoice.findFirst({
      where: { id, schoolId: req.user.schoolId }
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found or access denied.' });
    }

    const parentStudentId = await getParentStudentId(req);

    // Security: Students and Parents can only pay their own/child's invoices
    if (req.user.schoolUserRole === 'STUDENT' && invoice.studentId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You can only pay your own invoices.' });
    } else if (parentStudentId && invoice.studentId !== parentStudentId) {
      return res.status(403).json({ message: 'Access denied: You can only pay your child\'s invoices.' });
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

// Email fee payment receipt
router.post('/fees/:id/receipt/email', checkSubRole(['SCHOOL_ADMIN', 'ACCOUNTANT', 'STUDENT', 'PARENT']), async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.feeInvoice.findFirst({
      where: { id, schoolId: req.user.schoolId },
      include: {
        student: {
          select: { name: true, email: true }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found or access denied.' });
    }

    if (invoice.status !== 'PAID') {
      return res.status(400).json({ message: 'Receipt is only available for paid invoices.' });
    }

    const parentStudentId = await getParentStudentId(req);

    // Security: Students and Parents can only email their own/child's receipts
    if (req.user.schoolUserRole === 'STUDENT' && invoice.studentId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You can only email your own receipts.' });
    } else if (parentStudentId && invoice.studentId !== parentStudentId) {
      return res.status(403).json({ message: 'Access denied: You can only email your child\'s receipts.' });
    }

    const school = await prisma.school.findUnique({
      where: { id: req.user.schoolId }
    });

    const receiptHtml = `
      <h3>Receipt of Payment</h3>
      <p>Dear ${invoice.student.name},</p>
      <p>Thank you for your payment. Below is your structured digital receipt:</p>
      <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; max-width: 500px; font-family: sans-serif;">
        <tr style="background: #f4f4f4;">
          <td><strong>Invoice ID</strong></td>
          <td>#${invoice.id.substring(0, 8)}</td>
        </tr>
        <tr>
          <td><strong>School</strong></td>
          <td>${school ? school.schoolName : 'Unknown School'}</td>
        </tr>
        <tr>
          <td><strong>Amount Paid</strong></td>
          <td>$${invoice.amount.toFixed(2)}</td>
        </tr>
        <tr>
          <td><strong>Payment Date</strong></td>
          <td>${invoice.paymentDate}</td>
        </tr>
        <tr>
          <td><strong>Payment Method</strong></td>
          <td>${invoice.paymentMethod}</td>
        </tr>
        <tr style="background: #e6ffe6; color: green; font-weight: bold;">
          <td><strong>Status</strong></td>
          <td>PAID</td>
        </tr>
      </table>
      <p>Warm regards,<br/>Administration Team</p>
    `;

    await sendEmail({
      to: invoice.student.email,
      subject: `Receipt of Payment - Invoice #${invoice.id.substring(0, 8)}`,
      html: receiptHtml
    });

    return res.json({ message: 'Receipt emailed successfully.' });
  } catch (error) {
    console.error('Error emailing receipt:', error);
    return res.status(500).json({ message: 'Error emailing receipt.' });
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
router.post('/books', checkPermission('Library'), async (req, res) => {
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

    // Alert all students in the school about the new library book
    const students = await prisma.schoolUser.findMany({
      where: { schoolId: req.user.schoolId, role: 'STUDENT', active: true }
    });
    for (const stud of students) {
      sendEmail({
        to: stud.email,
        subject: `New Library Book Alert - ${title}`,
        html: `
          <h3>New Arrival in School Library!</h3>
          <p>Dear ${stud.name},</p>
          <p>A new book has been catalogued in the library and is available for checkout:</p>
          <ul>
            <li><strong>Title:</strong> ${title}</li>
            <li><strong>Author:</strong> ${author}</li>
            <li><strong>ISBN:</strong> ${isbn || 'N/A'}</li>
            <li><strong>Availability:</strong> ${qty} copies</li>
          </ul>
          <p>Happy reading!</p>
        `
      }).catch(err => console.error('Error alerting student about book:', err));
    }

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

// Checkout book copy
router.post('/books/:bookId/issue', checkPermission('Library'), async (req, res) => {
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

// Record book return
router.put('/books/issue/:id/return', checkPermission('Library'), async (req, res) => {
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

// ==========================================
// 7. VISITOR LOGS MODULE
// ==========================================

// Get visitor logs
router.get('/visitors', checkPermission('Visitors'), async (req, res) => {
  try {
    const logs = await prisma.visitorLog.findMany({
      where: { schoolId: req.user.schoolId },
      orderBy: { entryTime: 'desc' }
    });
    return res.json(logs);
  } catch (error) {
    console.error('Error fetching visitor logs:', error);
    return res.status(500).json({ message: 'Error retrieving logs.' });
  }
});

// Check in visitor
router.post('/visitors', checkPermission('Visitors'), async (req, res) => {
  try {
    const { name, phone, purpose } = req.body;
    if (!name || !phone || !purpose) {
      return res.status(400).json({ message: 'Name, phone, and purpose are required.' });
    }

    const log = await prisma.visitorLog.create({
      data: {
        schoolId: req.user.schoolId,
        name,
        phone,
        purpose,
        status: 'CHECKED_IN'
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorName: req.user.name,
        actorType: 'SCHOOL_USER',
        action: 'VISITOR_CHECKED_IN',
        details: `Visitor "${name}" checked in. Purpose: "${purpose}".`,
        ipAddress: req.ip
      }
    });

    return res.status(201).json(log);
  } catch (error) {
    console.error('Error creating visitor log:', error);
    return res.status(500).json({ message: 'Error recording check-in.' });
  }
});

// Check out visitor
router.put('/visitors/:id/checkout', checkPermission('Visitors'), async (req, res) => {
  try {
    const { id } = req.params;

    const log = await prisma.visitorLog.findFirst({
      where: { id, schoolId: req.user.schoolId }
    });

    if (!log) {
      return res.status(404).json({ message: 'Visitor record not found.' });
    }

    const updated = await prisma.visitorLog.update({
      where: { id },
      data: {
        status: 'CHECKED_OUT',
        exitTime: new Date()
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorName: req.user.name,
        actorType: 'SCHOOL_USER',
        action: 'VISITOR_CHECKED_OUT',
        details: `Visitor "${log.name}" checked out.`,
        ipAddress: req.ip
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error checking out visitor:', error);
    return res.status(500).json({ message: 'Error recording check-out.' });
  }
});

// Get school audit logs
router.get('/audit-logs', checkSubRole(['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL']), async (req, res) => {
  try {
    const users = await prisma.schoolUser.findMany({
      where: { schoolId: req.user.schoolId },
      select: { id: true }
    });
    const userIds = users.map(u => u.id);

    const logs = await prisma.auditLog.findMany({
      where: {
        actorId: { in: userIds },
        actorType: 'SCHOOL_USER'
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(logs);
  } catch (error) {
    console.error('Error fetching school audit logs:', error);
    return res.status(500).json({ message: 'Error retrieving logs.' });
  }
});

// GET /permissions
router.get('/permissions', async (req, res) => {
  try {
    const perms = await prisma.rolePermission.findMany({
      where: { schoolId: req.user.schoolId }
    });
    return res.json(perms);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return res.status(500).json({ message: 'Error retrieving permissions.' });
  }
});

// POST /permissions
router.post('/permissions', checkSubRole(['SCHOOL_ADMIN', 'PRINCIPAL']), async (req, res) => {
  try {
    const { roleName, menus } = req.body;
    if (!roleName || !Array.isArray(menus)) {
      return res.status(400).json({ message: 'Role Name and menus array are required.' });
    }

    const menusStr = menus.join(',');

    const perm = await prisma.rolePermission.upsert({
      where: {
        schoolId_roleName: {
          schoolId: req.user.schoolId,
          roleName: roleName.toUpperCase()
        }
      },
      update: { menus: menusStr },
      create: {
        schoolId: req.user.schoolId,
        roleName: roleName.toUpperCase(),
        menus: menusStr
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorName: req.user.name,
        actorType: 'SCHOOL_USER',
        action: 'ROLE_PERMISSIONS_UPDATED',
        details: `Updated permissions for role "${roleName.toUpperCase()}". Enabled: ${menusStr}`,
        ipAddress: req.ip
      }
    });

    return res.json(perm);
  } catch (error) {
    console.error('Error updating permissions:', error);
    return res.status(500).json({ message: 'Error updating permissions.' });
  }
});

// PUT /users/:id
router.put('/users/:id', checkSubRole(['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, active } = req.body;

    const user = await prisma.schoolUser.findFirst({
      where: { id, schoolId: req.user.schoolId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.schoolUser.update({
        where: { id },
        data: {
          name: name || user.name,
          email: email ? email.toLowerCase() : user.email,
          role: role || user.role,
          active: active !== undefined ? active : user.active
        }
      });

      if (updatedUser.role === 'TEACHER') {
        const { employeeId, subject, qualification } = req.body;
        await tx.teacherProfile.upsert({
          where: { userId: id },
          update: { employeeId, subject, qualification },
          create: { userId: id, employeeId: employeeId || 'N/A', subject: subject || 'General', qualification: qualification || 'N/A' }
        });
      } else if (updatedUser.role === 'STUDENT') {
        const { rollNumber, grade, section, parentName, parentPhone } = req.body;
        await tx.studentProfile.upsert({
          where: { userId: id },
          update: { rollNumber, grade, section, parentName, parentPhone },
          create: { userId: id, rollNumber: rollNumber || 'N/A', grade: grade || 'N/A', section: section || 'N/A', parentName: parentName || 'N/A', parentPhone: parentPhone || 'N/A' }
        });
      }

      return updatedUser;
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorName: req.user.name,
        actorType: 'SCHOOL_USER',
        action: 'USER_PROFILE_UPDATED',
        details: `Updated details for user "${updated.name}" (@${updated.username}).`,
        ipAddress: req.ip
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ message: 'Error updating user profile.' });
  }
});

// GET /users/:id/logs
router.get('/users/:id/logs', checkSubRole(['SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL']), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.schoolUser.findFirst({
      where: { id, schoolId: req.user.schoolId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { actorId: id },
          { details: { contains: user.name } },
          { details: { contains: user.username } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(logs);
  } catch (error) {
    console.error('Error fetching user audit logs:', error);
    return res.status(500).json({ message: 'Error retrieving user logs.' });
  }
});

// GET /students/:id/report
router.get('/students/:id/report', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, days, startDate, endDate } = req.query;

    const parentStudentId = await getParentStudentId(req);
    if (req.user.schoolUserRole === 'STUDENT' && id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    } else if (parentStudentId && id !== parentStudentId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    let startDateTime;
    if (startDate && endDate) {
      startDateTime = new Date(startDate);
    } else if (days && days !== 'custom') {
      const daysLimit = parseInt(days, 10) || 30;
      startDateTime = new Date();
      startDateTime.setDate(startDateTime.getDate() - daysLimit);
    }

    const endDateTime = endDate ? new Date(endDate) : new Date();

    let reportData = [];
    if (type === 'attendance') {
      reportData = await prisma.attendance.findMany({
        where: {
          studentId: id,
          ...(startDateTime ? {
            createdAt: {
              gte: startDateTime,
              lte: endDateTime
            }
          } : {})
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (type === 'fees') {
      reportData = await prisma.feeInvoice.findMany({
        where: {
          studentId: id,
          ...(startDateTime ? {
            createdAt: {
              gte: startDateTime,
              lte: endDateTime
            }
          } : {})
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (type === 'exams') {
      reportData = await prisma.examResult.findMany({
        where: {
          studentId: id,
          ...(startDateTime ? {
            createdAt: {
              gte: startDateTime,
              lte: endDateTime
            }
          } : {})
        },
        include: { exam: true },
        orderBy: { createdAt: 'desc' }
      });
    } else if (type === 'library') {
      reportData = await prisma.bookIssue.findMany({
        where: {
          studentId: id,
          ...(startDateTime ? {
            createdAt: {
              gte: startDateTime,
              lte: endDateTime
            }
          } : {})
        },
        include: { book: true },
        orderBy: { createdAt: 'desc' }
      });
    }

    return res.json(reportData);
  } catch (error) {
    console.error('Error fetching student report:', error);
    return res.status(500).json({ message: 'Error retrieving student report.' });
  }
});

// POST /students/:id/report/email
router.post('/students/:id/report/email', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, days, startDate, endDate } = req.body;

    const parentStudentId = await getParentStudentId(req);
    if (req.user.schoolUserRole === 'STUDENT' && id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    } else if (parentStudentId && id !== parentStudentId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    let startDateTime;
    if (startDate && endDate) {
      startDateTime = new Date(startDate);
    } else if (days && days !== 'custom') {
      const daysLimit = parseInt(days, 10) || 30;
      startDateTime = new Date();
      startDateTime.setDate(startDateTime.getDate() - daysLimit);
    }
    const endDateTime = endDate ? new Date(endDate) : new Date();

    let recordsHtml = '';
    let studentObj = await prisma.schoolUser.findUnique({ where: { id } });

    if (type === 'attendance') {
      const records = await prisma.attendance.findMany({
        where: { studentId: id, ...(startDateTime ? { createdAt: { gte: startDateTime, lte: endDateTime } } : {}) },
        orderBy: { createdAt: 'desc' }
      });
      recordsHtml = `
        <h3>Attendance History Logs</h3>
        <table border="1" cellpadding="6" style="border-collapse: collapse; width:100%;">
          <tr style="background:#f4f4f4;"><th>Date</th><th>Status</th><th>Marked By</th></tr>
          ${records.map(r => `<tr><td>${r.date}</td><td>${r.status}</td><td>${r.markedBy}</td></tr>`).join('')}
        </table>
      `;
    } else if (type === 'fees') {
      const records = await prisma.feeInvoice.findMany({
        where: { studentId: id, ...(startDateTime ? { createdAt: { gte: startDateTime, lte: endDateTime } } : {}) },
        orderBy: { createdAt: 'desc' }
      });
      recordsHtml = `
        <h3>Fees & Invoices History Logs</h3>
        <table border="1" cellpadding="6" style="border-collapse: collapse; width:100%;">
          <tr style="background:#f4f4f4;"><th>Invoice ID</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Paid On</th></tr>
          ${records.map(r => `<tr><td>#${r.id.substring(0,8)}</td><td>$${r.amount.toFixed(2)}</td><td>${r.dueDate}</td><td>${r.status}</td><td>${r.paymentDate || 'N/A'}</td></tr>`).join('')}
        </table>
      `;
    } else if (type === 'exams') {
      const records = await prisma.examResult.findMany({
        where: { studentId: id, ...(startDateTime ? { createdAt: { gte: startDateTime, lte: endDateTime } } : {}) },
        include: { exam: true },
        orderBy: { createdAt: 'desc' }
      });
      recordsHtml = `
        <h3>Exam Scores History Logs</h3>
        <table border="1" cellpadding="6" style="border-collapse: collapse; width:100%;">
          <tr style="background:#f4f4f4;"><th>Exam Name</th><th>Subject</th><th>Marks</th><th>Grade</th><th>Remarks</th></tr>
          ${records.map(r => `<tr><td>${r.exam.examName}</td><td>${r.exam.subject}</td><td>${r.marksObtained} / ${r.exam.maxMarks}</td><td>${r.grade || 'N/A'}</td><td>${r.remarks || 'None'}</td></tr>`).join('')}
        </table>
      `;
    } else if (type === 'library') {
      const records = await prisma.bookIssue.findMany({
        where: { studentId: id, ...(startDateTime ? { createdAt: { gte: startDateTime, lte: endDateTime } } : {}) },
        include: { book: true },
        orderBy: { createdAt: 'desc' }
      });
      recordsHtml = `
        <h3>Library Checkout History Logs</h3>
        <table border="1" cellpadding="6" style="border-collapse: collapse; width:100%;">
          <tr style="background:#f4f4f4;"><th>Book Title</th><th>Issue Date</th><th>Return Date</th><th>Status</th></tr>
          ${records.map(r => `<tr><td>${r.book.title}</td><td>${r.issueDate}</td><td>${r.returnDate || 'N/A'}</td><td>${r.status}</td></tr>`).join('')}
        </table>
      `;
    }

    const reportHtml = `
      <h2>Student History Log Report</h2>
      <p><strong>Student Name:</strong> ${studentObj ? studentObj.name : 'Unknown'}</p>
      <p><strong>Time Period:</strong> ${startDate && endDate ? `${startDate} to ${endDate}` : `${days || '30'} Days`}</p>
      <hr/>
      ${recordsHtml}
    `;

    await sendEmail({
      to: req.user.email,
      subject: `Student History Report - ${type.toUpperCase()}`,
      html: reportHtml
    });

    return res.json({ message: 'Report compiled and sent to your email successfully.' });
  } catch (error) {
    console.error('Error emailing student report:', error);
    return res.status(500).json({ message: 'Error emailing report.' });
  }
});

module.exports = router;
