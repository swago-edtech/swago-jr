import { NextResponse } from 'next/server';
import { connectDB, Waitlist } from '@swago/database';
import { requireAdmin } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();

    const waitlist = await Waitlist.find()
      .sort({ createdAt: -1 })
      .lean();

    // Transform data for Excel
    const excelData = waitlist.map((entry: any) => ({
      'Entry ID': entry._id.toString().slice(-8),
      'Kid Name': entry.kidName,
      'Kid Age': entry.kidAge,
      'Parent Email': entry.parentEmail,
      'Parent Phone': entry.parentPhone,
      'Notified': entry.notified ? 'Yes' : 'No',
      'Joined On': new Date(entry.createdAt).toLocaleDateString('en-IN'),
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Waitlist');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // Entry ID
      { wch: 20 }, // Kid Name
      { wch: 10 }, // Age
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 10 }, // Notified
      { wch: 15 }, // Joined On
    ];

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=ambassador-waitlist-${new Date().toISOString().split('T')[0]}.xlsx`,
      },
    });
  } catch (error: any) {
    console.error('Export waitlist error:', error);
    
    if (error.message === 'Unauthorized - Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to export waitlist' }, { status: 500 });
  }
}
