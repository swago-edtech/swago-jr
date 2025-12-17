import { NextResponse } from 'next/server';
import { connectDB, AmbassadorApplication } from '@swago/database';
import { requireAdmin } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();

    const applications = await AmbassadorApplication.find()
      .sort({ createdAt: -1 })
      .lean();

    // Transform data for Excel
    const excelData = applications.map((app: any) => ({
      'Application ID': app._id.toString().slice(-8),
      'Kid Name': app.kidName,
      'Kid Age': app.kidAge,
      'City': app.city,
      'Parent Name': app.parentName,
      'Parent Email': app.parentEmail,
      'Parent Phone': app.parentPhone,
      'Why Join': app.whyJoin || 'N/A',
      'Status': app.status,
      'Consent Given': app.consentGiven ? 'Yes' : 'No',
      'Admin Notes': app.adminNotes || '',
      'Reviewed At': app.reviewedAt 
        ? new Date(app.reviewedAt).toLocaleDateString('en-IN') 
        : 'Not Reviewed',
      'Applied On': new Date(app.createdAt).toLocaleDateString('en-IN'),
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // Application ID
      { wch: 20 }, // Kid Name
      { wch: 10 }, // Age
      { wch: 15 }, // City
      { wch: 20 }, // Parent Name
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 40 }, // Why Join
      { wch: 15 }, // Status
      { wch: 12 }, // Consent
      { wch: 30 }, // Admin Notes
      { wch: 15 }, // Reviewed At
      { wch: 15 }, // Applied On
    ];

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=ambassador-applications-${new Date().toISOString().split('T')[0]}.xlsx`,
      },
    });
  } catch (error: any) {
    console.error('Export applications error:', error);
    
    if (error.message === 'Unauthorized - Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to export applications' }, { status: 500 });
  }
}
