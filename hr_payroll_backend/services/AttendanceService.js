const attendanceRepo = require('../repositories/AttendanceRepository');
const shiftAssignRepo = require('../repositories/ShiftAssignmentRepository');
const { NotFoundError } = require('../utils/appError');
const logger = require('../utils/logger');

class AttendanceService {
  async getAll(tenantId, query) {
    const r = await attendanceRepo.findAll({ tenantId, query });
    r.data = r.data.map(a => ({
      id: a.id, tenantId: a.tenantId, employeeId: a.employeeId, shiftId: a.shiftId,
      attendanceDate: a.attendanceDate, checkInTime: a.checkInTime, checkOutTime: a.checkOutTime,
      checkInMethod: a.checkInMethod, checkOutMethod: a.checkOutMethod,
      status: a.status, lateMinutes: a.lateMinutes, earlyLeavingMinutes: a.earlyLeavingMinutes,
      overtimeMinutes: a.overtimeMinutes, totalWorkedMinutes: a.totalWorkedMinutes,
      isManualEntry: a.isManualEntry, remarks: a.remarks,
      employee: a.employee ? { id: a.employee.id, employeeCode: a.employee.employeeCode, name: `${a.employee.firstName} ${a.employee.lastName}` } : null,
      shift: a.shift ? { id: a.shift.id, code: a.shift.code, name: a.shift.name, startTime: a.shift.startTime, endTime: a.shift.endTime } : null,
      createdAt: a.createdAt, updatedAt: a.updatedAt,
    }));
    return r;
  }

  async getById(id, tenantId) { const a = await attendanceRepo.findById(id, tenantId); if (!a) throw new NotFoundError('Attendance record not found'); return this.getAll(tenantId, { employeeId: a.employeeId, dateFrom: a.attendanceDate, dateTo: a.attendanceDate, limit: 1 }).then(r => r.data[0]); }

  async markAttendance(data, tenantId, userId) {
    const { employeeId, attendanceDate, checkInTime, checkOutTime, method } = data;

    // Check for existing record
    let record = await attendanceRepo.findByDate(employeeId, attendanceDate, tenantId);

    if (record) {
      // Update existing — mark checkout
      const updateData = { updatedBy: userId };
      if (checkOutTime) {
        updateData.checkOutTime = new Date(checkOutTime);
        updateData.checkOutMethod = method || 'Manual';
        // Calculate worked minutes
        if (record.checkInTime) {
          const diff = (new Date(checkOutTime) - new Date(record.checkInTime)) / 60000;
          updateData.totalWorkedMinutes = Math.max(0, Math.round(diff));
        }
        updateData.status = 'Present';
      }
      if (checkInTime && !record.checkInTime) {
        updateData.checkInTime = new Date(checkInTime);
        updateData.checkInMethod = method || 'Manual';
        updateData.status = 'Present';
        // Check lateness against assigned shift
        const assignment = await shiftAssignRepo.findActiveAssignment(employeeId, tenantId);
        if (assignment && assignment.shift) {
          const shiftStart = assignment.shift.startTime;
          const checkIn = new Date(checkInTime);
          const shiftStartDate = new Date(attendanceDate + 'T' + shiftStart);
          const diffMinutes = Math.round((checkIn - shiftStartDate) / 60000);
          if (diffMinutes > assignment.shift.lateThresholdMinutes) {
            updateData.status = 'Absent';
          } else if (diffMinutes > assignment.shift.gracePeriodMinutes) {
            updateData.status = 'Late';
            updateData.lateMinutes = diffMinutes;
          }
        }
      }
      await attendanceRepo.update(record.id, tenantId, updateData);
      return await attendanceRepo.findById(record.id, tenantId);
    } else {
      // Create new check-in
      const createData = {
        tenantId, employeeId, attendanceDate,
        checkInTime: checkInTime ? new Date(checkInTime) : null,
        checkInMethod: method || 'Manual',
        status: 'Present', isManualEntry: true,
        createdBy: userId, updatedBy: userId,
      };
      // Check lateness
      const assignment = await shiftAssignRepo.findActiveAssignment(employeeId, tenantId);
      if (assignment && assignment.shift && checkInTime) {
        createData.shiftId = assignment.shiftId;
        const checkIn = new Date(checkInTime);
        const shiftStartDate = new Date(attendanceDate + 'T' + assignment.shift.startTime);
        const diffMinutes = Math.round((checkIn - shiftStartDate) / 60000);
        if (diffMinutes > assignment.shift.lateThresholdMinutes) {
          createData.status = 'Absent';
        } else if (diffMinutes > assignment.shift.gracePeriodMinutes) {
          createData.status = 'Late';
          createData.lateMinutes = diffMinutes;
        }
      }
      record = await attendanceRepo.create(createData);
    }

    return this.getById(record.id, tenantId);
  }

  async update(id, data, tenantId, userId) {
    const a = await attendanceRepo.findById(id, tenantId); if (!a) throw new NotFoundError('Attendance record not found');
    await attendanceRepo.update(id, tenantId, { ...data, updatedBy: userId });
    return await attendanceRepo.findById(id, tenantId);
  }

  async delete(id, tenantId) { const a = await attendanceRepo.findById(id, tenantId); if (!a) throw new NotFoundError('Attendance record not found'); await attendanceRepo.delete(id, tenantId); return { success: true }; }

  async getTodaySummary(tenantId, employeeId = null) { return attendanceRepo.getTodaySummary(tenantId, employeeId); }

  async bulkMark(records, tenantId, userId) {
    return attendanceRepo.bulkCreate(records.map(r => ({ ...r, tenantId, createdBy: userId, updatedBy: userId })));
  }
}

module.exports = new AttendanceService();
