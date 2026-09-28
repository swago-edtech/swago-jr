import PDFDocument from 'pdfkit';
import { Order, InvoiceCounter } from '@swago/database';
import { PassThrough } from 'stream';
import fs from 'fs';
import path from 'path';
import { getInternationalOrderDisplay } from '@swago/utils';

function numberToWords(num: number): string {
  if (num === 0) return 'ZERO RUPEES ONLY';
  const a = ['','ONE ','TWO ','THREE ','FOUR ', 'FIVE ','SIX ','SEVEN ','EIGHT ','NINE ','TEN ','ELEVEN ','TWELVE ','THIRTEEN ','FOURTEEN ','FIFTEEN ','SIXTEEN ','SEVENTEEN ','EIGHTEEN ','NINETEEN '];
  const b = ['', '', 'TWENTY','THIRTY','FORTY','FIFTY', 'SIXTY','SEVENTY','EIGHTY','NINETY'];
  const n = ('000000000' + Math.floor(num)).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] !== '00') ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'CRORE ' : '';
  str += (n[2] !== '00') ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'LAKH ' : '';
  str += (n[3] !== '00') ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'THOUSAND ' : '';
  str += (n[4] !== '0') ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'HUNDRED ' : '';
  str += (n[5] !== '00') ? ((str !== '') ? 'AND ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
  return str.trim() + ' RUPEES ONLY';
}

/** International orders only: "USD TWELVE AND 50/100 ONLY". */
function amountToWordsIntl(amount: number, currency: string): string {
  const whole = Math.floor(amount);
  const cents = Math.round((amount - whole) * 100);
  const words = whole === 0 ? 'ZERO' : numberToWords(whole).replace(/ RUPEES ONLY$/, '');
  return `${currency} ${words}${cents > 0 ? ` AND ${String(cents).padStart(2, '0')}/100` : ''} ONLY`;
}

export async function generateAndUploadInvoice(order: any): Promise<void> {
  console.log(`[InvoiceService] Generating invoice for order ${order.orderId || order._id}...`);
  try {
    let invoiceNumber = `Swg-${String(Date.now()).slice(-7)}`;
    try {
      let counter = await InvoiceCounter.findOneAndUpdate(
        { key: 'invoice' },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
      );
      if (counter && counter.sequence < 2600183) {
        counter = await InvoiceCounter.findOneAndUpdate(
          { key: 'invoice' },
          { $set: { sequence: 2600183 } },
          { new: true }
        );
      }
      invoiceNumber = `Swg-${counter.sequence}`;
    } catch (err) {
      console.error('[InvoiceService] Error generating sequence:', err);
    }

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const pass = new PassThrough();
    const chunks: Buffer[] = [];
    
    pass.on('data', chunk => chunks.push(Buffer.from(chunk)));
    pass.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        
        // Save to root directory for testing
        const safePath = path.join(process.cwd().includes('apps') ? path.join(process.cwd(), '../..') : process.cwd(), `invoice_${order.orderId || order._id}.pdf`);
        try { fs.writeFileSync(safePath, buffer); } catch(e) {}
        console.log(`[InvoiceService] Saved PDF to local filesystem at ${safePath}`);

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.replace(/['"]/g, '') || '';
        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`;
        
        const formData = new FormData();
        const blob = new Blob([buffer], { type: 'application/pdf' });
        const filename = `invoice_${order.orderId || order._id}.pdf`;
        formData.append('file', blob, filename);
        formData.append('upload_preset', 'swago111');
        
        const cloudinaryResponse = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });

        if (cloudinaryResponse.ok) {
          const result = await cloudinaryResponse.json();
          console.log(`[InvoiceService] Uploaded successfully: ${result.secure_url}`);
          await Order.updateOne({ _id: order._id }, { invoiceUrl: result.secure_url });
        } else {
          console.error('[InvoiceService] Cloudinary error:', await cloudinaryResponse.text());
        }
      } catch (err) {
        console.error('[InvoiceService] Cloudinary Upload Failed:', err);
      }
    });

    doc.pipe(pass);
    
    // --- Draw Invoice ---
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('GSTIN: 03ACJFA6246K1ZC', 30, 30);
    doc.text('Tax Invoice', 0, 30, { align: 'center' });
    doc.text('Original', 0, 30, { align: 'right', width: 565 });
    
    doc.moveTo(30, 42).lineTo(565, 42).lineWidth(0.5).stroke('#000000');
    
    // Logo
    const logoY = 48;
    try {
        const logoPath = path.join(process.cwd().includes('apps') ? process.cwd() : path.join(process.cwd(), 'apps/web'), 'public/Swago_logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 255, logoY, { width: 85 });
        } else {
            doc.fontSize(20).font('Helvetica-Bold').fillColor('#ff0000').text('SWAGO', 255, logoY, { width: 85, align: 'center' });
        }
    } catch(e) {}
    
    doc.fillColor('#000000').fontSize(8).font('Helvetica');
    
    const emailRowY = logoY + 45; // Reduced space to match top margin
    doc.text('https://Swago.co', 0, emailRowY, { align: 'center' });
    doc.text('E-mail id: support@swagojr.com', 30, emailRowY);
    doc.text('+91 62838 83397', 0, emailRowY, { align: 'right', width: 565 });
    
    // Separator directly below the email row
    const yAfterLogo = emailRowY + 15;
    doc.moveTo(30, yAfterLogo).lineTo(565, yAfterLogo).lineWidth(0.5).stroke('#000000');
    
    // Details
    const infoY = yAfterLogo + 10;
    const invNo = invoiceNumber;
    const invDate = new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const orderDateFormatted = new Date(order.createdAt || new Date()).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const paymentStr = order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Prepaid (Razorpay)';
    // International orders only: amounts in the charged currency. null for India (unchanged).
    const intl = getInternationalOrderDisplay(order);
    const cur = (n: number) => (intl ? intl.formatCode(n) : `Rs. ${n.toFixed(2)}`);
    
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text(`Invoice No: `, 30, infoY, { continued: true }).font('Helvetica').text(invNo);
    doc.font('Helvetica-Bold').text(`Order Id: `, 30, infoY + 15, { continued: true }).font('Helvetica').text(`# ${order.orderId || order._id}`);
    doc.font('Helvetica-Bold').text(`Invoice Date: `, 30, infoY + 30, { continued: true }).font('Helvetica').text(invDate);
    doc.font('Helvetica-Bold').text(`Payment: `, 30, infoY + 45, { continued: true }).font('Helvetica').text(paymentStr);
    
    doc.font('Helvetica-Bold').text('Place of Supply', 300, infoY);
    doc.text(`City: `, 300, infoY + 15, { continued: true }).font('Helvetica').text(`${order.city || 'N/A'}, `, { continued: true }).font('Helvetica-Bold').text('State: ', { continued: true }).font('Helvetica').text(order.state || 'N/A');
    doc.font('Helvetica-Bold').text(`Pincode: `, 300, infoY + 30, { continued: true }).font('Helvetica').text(order.pincode || 'N/A');
    doc.font('Helvetica-Bold').text(`Order Date: `, 300, infoY + 45, { continued: true }).font('Helvetica').text(orderDateFormatted);
    
    // Grid
    const gridY = infoY + 65;
    doc.moveTo(30, gridY).lineTo(565, gridY).stroke('#000000');
    
    doc.rect(30, gridY, 535, 20).fillAndStroke('#f3f4f6', '#000000');
    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
    doc.text('BILLED TO', 30, gridY + 6, { width: 178, align: 'center' });
    doc.text('SHIP TO', 208, gridY + 6, { width: 178, align: 'center' });
    doc.text('SUPPLIER', 386, gridY + 6, { width: 178, align: 'center' });
    
    doc.moveTo(208, gridY).lineTo(208, gridY + 20).stroke('#000000');
    doc.moveTo(386, gridY).lineTo(386, gridY + 20).stroke('#000000');
    
    
    
    const detailsY = gridY + 30;
    doc.fontSize(9);
    
    doc.font('Helvetica-Bold').text(order.name || 'N/A', 40, detailsY, { width: 158 });
    doc.font('Helvetica').text(`${order.address || 'N/A'}\nCity: ${order.city || 'N/A'}\nState: ${order.state || 'N/A'}, Pincode: ${order.pincode || 'N/A'}`, 40, detailsY + 15, { width: 158 });
    doc.font('Helvetica-Bold').text('Tel: ', 40, detailsY + 65, { continued: true }).font('Helvetica').text(order.phone || 'N/A');
    doc.font('Helvetica-Bold').text('Email: ', 40, detailsY + 80);
    doc.font('Helvetica').text(order.email || 'N/A', 75, detailsY + 80, { width: 120 });
    
    doc.font('Helvetica-Bold').text(order.name || 'N/A', 218, detailsY, { width: 158 });
    doc.font('Helvetica').text(`${order.address || 'N/A'}\nCity: ${order.city || 'N/A'}\nState: ${order.state || 'N/A'}, Pincode: ${order.pincode || 'N/A'}`, 218, detailsY + 15, { width: 158 });
    doc.font('Helvetica-Bold').text('Tel: ', 218, detailsY + 65, { continued: true }).font('Helvetica').text(order.phone || 'N/A');
    doc.font('Helvetica-Bold').text('Email: ', 218, detailsY + 80);
    doc.font('Helvetica').text(order.email || 'N/A', 253, detailsY + 80, { width: 120 });
    
    doc.font('Helvetica-Bold').text('Brand: SWAGO', 396, detailsY, { width: 158 });
    doc.font('Helvetica').text('3, Basant Avenue Near BCM School dugri Ludhiana\nLUDHIANA, Pin: 141013, Punjab, India', 396, detailsY + 15, { width: 158 });
    doc.font('Helvetica-Bold').text('Tel: ', 396, detailsY + 65, { continued: true }).font('Helvetica').text('+91 62838 83397');
    doc.font('Helvetica-Bold').text('Email: ', 396, detailsY + 80);
    doc.font('Helvetica').text('support@swagojr.com', 431, detailsY + 80, { width: 120 });
    
    doc.moveTo(30, gridY + 140).lineTo(565, gridY + 140).stroke('#000000');
    
    // Table Header
    const tableY = gridY + 160;
    doc.rect(30, tableY, 535, 20).fillAndStroke('#f3f4f6', '#000000');
    doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold');
    
    const colX = { name: 40, qty: 160, rate: 200, taxVal: 270, hsn: 340, gst: 390, igst: 430, total: 500 };
    doc.text('Product Name & SKU', colX.name, tableY + 6);
    doc.text('Qty', colX.qty, tableY + 6);
    doc.text('Rate', colX.rate, tableY + 6);
    doc.text('Taxable Val', colX.taxVal, tableY + 6);
    doc.text('HSN', colX.hsn, tableY + 6);
    doc.text('GST', colX.gst, tableY + 6);
    doc.text('IGST', colX.igst, tableY + 6);
    doc.text('Total', colX.total, tableY + 6);
    
    let itemY = tableY + 30;
    let totalTaxable = 0;
    let totalIGST = 0;
    const itemsList = order.items || [];
    
    doc.font('Helvetica');
    itemsList.forEach((item: any, itemIdx: number) => {
        const qty = item.quantity || 1;
        const rate = intl ? (intl.items[itemIdx]?.localPrice || 0) : (item.price || 0);
        const itemTotal = rate * qty;
        
        const taxableVal = itemTotal / 1.05;
        const igst = itemTotal - taxableVal;
        
        totalTaxable += taxableVal;
        totalIGST += igst;
        
        const nameText = item.name || 'Item';
        const nameHeight = doc.heightOfString(nameText, { width: 110 });
        const rowHeight = Math.max(25, nameHeight + 10);
        
        doc.text(nameText, colX.name, itemY, { width: 110 });
        doc.text(qty.toString(), colX.qty, itemY);
        doc.text(cur(rate), colX.rate, itemY);
        doc.text(cur(taxableVal), colX.taxVal, itemY);
        doc.text('95049090', colX.hsn, itemY);
        doc.text('5%', colX.gst, itemY);
        doc.text(cur(igst), colX.igst, itemY);
        doc.text(cur(itemTotal), colX.total, itemY);
        
        itemY += rowHeight;
    });
    
    doc.moveTo(30, itemY).lineTo(565, itemY).stroke('#000000');
    itemY += 5;
    doc.font('Helvetica-Bold');
    doc.rect(30, itemY, 120, 20).fillAndStroke('#f3f4f6', '#f3f4f6');
    doc.fillColor('#000000').text('Total', colX.name, itemY + 5);
    
    const grandTotal = intl ? intl.totalLocal : (order.total || order.items?.reduce((acc: number, cur: any) => acc + (cur.price * cur.quantity), 0) || 0);
    const itemsTotal = intl ? intl.subtotalLocal : itemsList.reduce((acc: number, cur: any) => acc + (cur.price * cur.quantity), 0);
    
    doc.text(cur(itemsTotal), colX.rate - 10, itemY + 5);
    doc.text(cur(totalTaxable), colX.taxVal, itemY + 5);
    doc.text(cur(totalIGST), colX.igst - 5, itemY + 5);
    doc.text(cur(itemsTotal), colX.total, itemY + 5);
    
    itemY += 25;
    doc.moveTo(30, itemY).lineTo(565, itemY).stroke('#000000');
    
    const footerY = itemY + 25;
    
    const sumX1 = 340;
    const sumX2 = 470;
    doc.fontSize(11).font('Helvetica-Bold').text('Amount Summary', sumX1, footerY);
    
    doc.fontSize(9);
    let sY = footerY + 20;
    doc.text('MRP Total:', sumX1, sY); doc.text(cur(itemsTotal), sumX2, sY); sY += 15;
    
    if (intl) {
        // International orders: coupon / Swago Money / shipping in the charged currency
        if (order.discount > 0) {
            doc.text(`Coupon (${order.couponCode || 'DISCOUNT'}):`, sumX1, sY); doc.text(`${intl.currency} - ${intl.discountLocal.toFixed(2)}`, sumX2, sY); sY += 15;
        }
        if (order.swagoMoneyRedeemed > 0) {
            doc.text('Swago Money:', sumX1, sY); doc.text(`${intl.currency} - ${intl.swagoLocal.toFixed(2)}`, sumX2, sY); sY += 15;
        }
        if (intl.shippingLocal > 0) {
            doc.text('Intl. Shipping:', sumX1, sY); doc.text(cur(intl.shippingLocal), sumX2, sY); sY += 15;
        }
    } else {
    if (order.discount > 0) {
        doc.text(`Coupon (${order.couponCode || 'DISCOUNT'}):`, sumX1, sY); doc.text(`Rs. - ${order.discount.toFixed(2)}`, sumX2, sY); sY += 15;
    }
    if (order.swagoMoneyRedeemed > 0) {
        doc.text('Swago Money:', sumX1, sY); doc.text(`Rs. - ${order.swagoMoneyRedeemed.toFixed(2)}`, sumX2, sY); sY += 15;
    }
    if (order.shippingFee > 0) {
        doc.text('Shipping Fee:', sumX1, sY); doc.text(`Rs. ${order.shippingFee.toFixed(2)}`, sumX2, sY); sY += 15;
    }
    }
    
    doc.font('Helvetica-Bold');
    doc.text('Amount Paid:', sumX1, sY); doc.text(cur(grandTotal), sumX2, sY); sY += 15;
    doc.font('Helvetica');
    const finalTaxable = grandTotal / 1.05;
    const finalIGST = grandTotal - finalTaxable;
    doc.text('Taxable Value:', sumX1, sY); doc.text(cur(finalTaxable), sumX2, sY); sY += 15;
    doc.text('IGST (5%):', sumX1, sY); doc.text(cur(finalIGST), sumX2, sY); sY += 15;
    
    doc.font('Helvetica-Bold');
    doc.text('Grand Total:', sumX1, sY); doc.text(cur(grandTotal), sumX2, sY); sY += 15;
    
    doc.rect(sumX1, sY - 5, 225, 20).fillAndStroke('#f3f4f6', '#000000');
    doc.fillColor('#000000').text('Total', sumX1 + 5, sY + 2);
    doc.text(cur(grandTotal), sumX2, sY + 2);
    
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Terms and Conditions apply', 30, footerY + 20);
    doc.moveTo(30, footerY + 35).lineTo(300, footerY + 35).lineWidth(0.5).stroke('#000000');
    
    doc.text('Amount in words', 30, footerY + 45);
    doc.font('Helvetica').text(intl ? amountToWordsIntl(grandTotal, intl.currency) : numberToWords(grandTotal), 30, footerY + 60, { width: 270 });
    if (intl) {
        doc.text(`International order (${intl.country}). Charged in ${intl.currency}; INR ledger value Rs. ${Number(order.total || 0).toFixed(2)} at 1 INR = ${intl.rate} ${intl.currency}.`, 30, doc.y + 4, { width: 270 });
    }
    
    const lineY = doc.y + 10;
    doc.moveTo(30, lineY).lineTo(300, lineY).stroke('#000000');
    doc.font('Helvetica-Bold').text('E. & O.E', 30, lineY + 10);
    
    doc.font('Helvetica').fontSize(10).text('This is a Computer Generated Invoice', 0, 780, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('[InvoiceService] Error generating invoice:', error);
  }
}
