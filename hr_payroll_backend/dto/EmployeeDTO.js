/**
 * Employee DTO
 * 
 * Transforms employee data between API and database formats.
 */

class EmployeeDTO {

  /**
   * Transform for list response (compact).
   */
  static toListResponse(employees) {
    return employees.map(emp => ({
      id: emp.id,
      employeeCode: emp.employeeCode,
      firstName: emp.firstName,
      middleName: emp.middleName,
      lastName: emp.lastName,
      fullName: `${emp.firstName} ${emp.lastName}`,
      gender: emp.gender,
      nationality: emp.nationality,
      workEmail: emp.workEmail,
      mobileNumber: emp.mobileNumber,
      joiningDate: emp.joiningDate,
      contractEndDate: emp.contractEndDate,
      status: emp.status,
      totalSalary: emp.totalSalary ? parseFloat(emp.totalSalary) : 0,
      photo: emp.photo,
      department: emp.department ? {
        id: emp.department.id,
        code: emp.department.code,
        name: emp.department.name,
      } : null,
      designation: emp.designation ? {
        id: emp.designation.id,
        code: emp.designation.code,
        name: emp.designation.name,
      } : null,
      branch: emp.branch ? {
        id: emp.branch.id,
        code: emp.branch.code,
        name: emp.branch.name,
      } : null,
      reportingManager: emp.reportingManager ? {
        id: emp.reportingManager.id,
        employeeCode: emp.reportingManager.employeeCode,
        fullName: `${emp.reportingManager.firstName} ${emp.reportingManager.lastName}`,
      } : null,
    }));
  }

  /**
   * Transform for detail response (complete).
   */
  static toDetailResponse(emp) {
    if (!emp) return null;

    return {
      id: emp.id,
      tenantId: emp.tenantId,
      employeeCode: emp.employeeCode,

      // Personal
      firstName: emp.firstName,
      middleName: emp.middleName,
      lastName: emp.lastName,
      fullName: `${emp.firstName} ${emp.lastName}`,
      fullNameAr: emp.fullNameAr,
      gender: emp.gender,
      dateOfBirth: emp.dateOfBirth,
      placeOfBirth: emp.placeOfBirth,
      nationality: emp.nationality,
      religion: emp.religion,
      maritalStatus: emp.maritalStatus,
      bloodGroup: emp.bloodGroup,

      // Contact
      personalEmail: emp.personalEmail,
      workEmail: emp.workEmail,
      mobileNumber: emp.mobileNumber,
      workPhone: emp.workPhone,
      emergencyContactName: emp.emergencyContactName,
      emergencyContactNumber: emp.emergencyContactNumber,
      emergencyContactRelation: emp.emergencyContactRelation,

      // Address
      addressLine1: emp.addressLine1,
      addressLine2: emp.addressLine2,
      city: emp.city,
      state: emp.state,
      country: emp.country,
      postalCode: emp.postalCode,

      // Passport
      passportNumber: emp.passportNumber,
      passportIssueDate: emp.passportIssueDate,
      passportExpiryDate: emp.passportExpiryDate,
      passportIssueCountry: emp.passportIssueCountry,

      // Visa
      visaNumber: emp.visaNumber,
      visaType: emp.visaType,
      visaIssueDate: emp.visaIssueDate,
      visaExpiryDate: emp.visaExpiryDate,
      visaIssuePlace: emp.visaIssuePlace,

      // Emirates ID
      emiratesId: emp.emiratesId,
      emiratesIdExpiryDate: emp.emiratesIdExpiryDate,

      // Labor Card
      laborCardNumber: emp.laborCardNumber,
      laborCardExpiryDate: emp.laborCardExpiryDate,

      // Employment
      joiningDate: emp.joiningDate,
      confirmationDate: emp.confirmationDate,
      contractStartDate: emp.contractStartDate,
      contractEndDate: emp.contractEndDate,
      contractType: emp.contractType,
      employmentType: emp.employmentType,
      probationEndDate: emp.probationEndDate,
      resignationDate: emp.resignationDate,
      lastWorkingDate: emp.lastWorkingDate,
      terminationDate: emp.terminationDate,
      terminationReason: emp.terminationReason,
      status: emp.status,

      // Organization
      department: emp.department ? {
        id: emp.department.id,
        code: emp.department.code,
        name: emp.department.name,
        nameAr: emp.department.nameAr,
      } : null,
      departmentId: emp.departmentId,
      designation: emp.designation ? {
        id: emp.designation.id,
        code: emp.designation.code,
        name: emp.designation.name,
        nameAr: emp.designation.nameAr,
      } : null,
      designationId: emp.designationId,
      branch: emp.branch ? {
        id: emp.branch.id,
        code: emp.branch.code,
        name: emp.branch.name,
        nameAr: emp.branch.nameAr,
      } : null,
      branchId: emp.branchId,
      costCenter: emp.costCenter ? {
        id: emp.costCenter.id,
        code: emp.costCenter.code,
        name: emp.costCenter.name,
      } : null,
      costCenterId: emp.costCenterId,
      reportingManager: emp.reportingManager ? {
        id: emp.reportingManager.id,
        employeeCode: emp.reportingManager.employeeCode,
        fullName: `${emp.reportingManager.firstName} ${emp.reportingManager.lastName}`,
      } : null,
      reportingManagerId: emp.reportingManagerId,

      // Salary
      basicSalary: emp.basicSalary ? parseFloat(emp.basicSalary) : 0,
      housingAllowance: emp.housingAllowance ? parseFloat(emp.housingAllowance) : 0,
      transportAllowance: emp.transportAllowance ? parseFloat(emp.transportAllowance) : 0,
      otherAllowances: emp.otherAllowances ? parseFloat(emp.otherAllowances) : 0,
      totalSalary: emp.totalSalary ? parseFloat(emp.totalSalary) : 0,
      salaryCurrency: emp.salaryCurrency,
      bankName: emp.bankName,
      bankAccountNumber: emp.bankAccountNumber,
      iban: emp.iban,
      swiftCode: emp.swiftCode,
      wpsAgentCode: emp.wpsAgentCode,

      // Other
      photo: emp.photo,
      notes: emp.notes,

      // Documents
      documents: (emp.documents || []).map(doc => ({
        id: doc.id,
        documentType: doc.documentType,
        title: doc.title,
        fileName: doc.fileName,
        filePath: doc.filePath,
        issueDate: doc.issueDate,
        expiryDate: doc.expiryDate,
      })),

      // Subordinates
      subordinates: (emp.subordinates || []).map(sub => ({
        id: sub.id,
        employeeCode: sub.employeeCode,
        fullName: `${sub.firstName} ${sub.lastName}`,
      })),

      // Metadata
      createdAt: emp.createdAt,
      updatedAt: emp.updatedAt,
    };
  }

  /**
   * Sanitize input data before creating/updating.
   */
  static sanitizeInput(data) {
    const sanitized = { ...data };

    // Convert empty strings to null for optional UUID fields
    const nullableFields = [
      'departmentId', 'designationId', 'branchId', 'costCenterId',
      'reportingManagerId', 'photo',
    ];
    nullableFields.forEach(field => {
      if (sanitized[field] === '' || sanitized[field] === undefined) {
        sanitized[field] = null;
      }
    });

    // Parse decimal fields
    const decimalFields = ['basicSalary', 'housingAllowance', 'transportAllowance', 'otherAllowances', 'totalSalary'];
    decimalFields.forEach(field => {
      if (sanitized[field] !== undefined && sanitized[field] !== null) {
        sanitized[field] = parseFloat(sanitized[field]) || 0;
      }
    });

    return sanitized;
  }
}

module.exports = EmployeeDTO;
