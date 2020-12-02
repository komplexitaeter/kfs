<?php

function create_purchase_doc($language_code, $purchase_qty, $single_price, $document_type, $purchase_address_arr
            , $email_address, $document_number, $tlo) {

    require('./lib/fpdf.php');

    for ($i = count($purchase_address_arr); $i<7; $i++) $purchase_address_arr[$i] = '';

    if ($document_type == 'OFFER') {
        $header = get_translation_val($tlo, 'header_offer', $language_code);
        $intro_line_1 = get_translation_val($tlo, 'into_line_1_offer', $language_code);
        $number_label = get_translation_val($tlo, 'number_label_offer', $language_code);
        $text_line_1 = get_translation_val($tlo, 'text_offer_line_1', $language_code);
        $text_line_2 = get_translation_val($tlo, 'text_offer_line_2', $language_code);
        $text_line_3 = get_translation_val($tlo, 'text_offer_line_3', $language_code);
    } else {
        $header = get_translation_val($tlo, 'header_invoice', $language_code);
        $intro_line_1 = get_translation_val($tlo, 'into_line_1_invoice', $language_code);
        $number_label = get_translation_val($tlo, 'number_label_invoice', $language_code);
        $text_line_1 = get_translation_val($tlo, 'text_invoice_line_1', $language_code);
        $text_line_2 = get_translation_val($tlo, 'text_invoice_line_2', $language_code);
        $text_line_3 = get_translation_val($tlo, 'text_invoice_line_3', $language_code);
    }

    if ($language_code == 'en') {
        $date_val = date("m/d/Y");
    } else {
        $date_val = date("d.m.Y");
    }

    $amount_total = round($purchase_qty*$single_price, 2);
    $amount_tax = round($amount_total*_VAT_TAX_RATE/100, 2);
    $amount_net = $amount_total - $amount_tax;

    $tbl_single_price = number_format($single_price, 2, ',', '.');
    $tbl_qty = number_format($purchase_qty, 2, ',', '.');
    $tbl_total = number_format($amount_total, 2, ',', '.');

    $tbl_tax_rate = number_format(_VAT_TAX_RATE, 2, ',', '.');
    $tbl_sum_net = number_format($amount_net, 2, ',', '.');
    $tbl_sum_tax = number_format($amount_tax, 2, ',', '.');
    $tbl_sum_total = number_format($amount_total, 2, ',', '.');


    $pdf = new FPDF();

    $pdf->SetMargins(13,13);
    $pdf->SetAuthor('Komplexitaeter UG (haftungsbeschraenkt)');
    $pdf->SetAutoPageBreak(false);

    $pdf->AddPage();
    $pdf->SetFont('Arial','',9);

    $pdf->Cell(0,4 ,utf8_decode('Komplexitäter UG (haftungsbeschränkt)'),0, 1, 'R');
    $pdf->Cell(0,4 ,utf8_decode('Landshuter Str. 4'),0, 1, 'R');

    $pdf->Cell(0,4,utf8_decode('10779 Berlin'),0, 1, 'R');
    $pdf->Ln();
    $pdf->Cell(0,4,utf8_decode('www.komplexitaeter.de'),0, 1, 'R');
    $pdf->Cell(0,4,utf8_decode('hallo@komplexitaeter.de'),0, 1, 'R');
    $pdf->Cell(0,4,utf8_decode('+49 (0) 30 / 86 320 529'),0, 1, 'R');
    $pdf->Ln();
    $pdf->Ln();
    $pdf->Cell(110,4 ,substr(utf8_decode($purchase_address_arr[0]), 0, 60),0, 0, 'L');
    $pdf->SetFont('Arial','I',9);
    $pdf->Cell(0,4 ,'Login: '.$email_address,0, 1, 'R');
    $pdf->SetFont('Arial','',9);
    $pdf->Cell(0,4 ,substr(utf8_decode($purchase_address_arr[1]), 0, 60),0, 1, 'L');
    $pdf->Cell(0,4 ,substr(utf8_decode($purchase_address_arr[2]), 0, 60),0, 1, 'L');
    $pdf->Cell(0,4 ,substr(utf8_decode($purchase_address_arr[3]), 0, 60),0, 1, 'L');
    $pdf->Cell(0,4 ,substr(utf8_decode($purchase_address_arr[4]), 0, 60),0, 1, 'L');
    $pdf->Cell(0,4 ,substr(utf8_decode($purchase_address_arr[5]), 0, 60),0, 1, 'L');
    $pdf->Cell(0,4 ,substr(utf8_decode($purchase_address_arr[6]), 0, 60),0, 1, 'L');

    $pdf->Ln();
    $pdf->SetFont('Arial','B',9);
    $pdf->Cell(0,4 ,utf8_decode($header),0, 1, 'L');
    $pdf->SetFont('Arial','',9);
    $pdf->Ln();
    $pdf->Cell(0,4 ,utf8_decode(get_translation_val($tlo, 'greeting', $language_code)),0, 1, 'L');
    $pdf->Ln();
    $pdf->Cell(0,4 ,utf8_decode($intro_line_1),0, 1, 'L');
    $pdf->Ln();
    $pdf->SetFont('Arial','B',9);
    $pdf->Cell(26,4 ,utf8_decode($number_label),0, 0, 'L');
    $pdf->Cell(125,4 ,utf8_decode($document_number),0, 0, 'L');
    $pdf->Cell(13,4 ,utf8_decode(get_translation_val($tlo, 'date_label', $language_code)),0, 0, 'L');
    $pdf->Cell(0,4 ,utf8_decode($date_val),0, 0, 'R');
    $pdf->SetFont('Arial','',9);
    $pdf->Ln();
    /* next line is preserved for references but not implemented yet*/
    $pdf->Cell(26,4 ,utf8_decode(''),0, 0, 'L');
    $pdf->Cell(40,4 ,utf8_decode(''),0, 0, 'L');
    /* so we leave it blank now but print it to keep the spacings*/
    $pdf->Ln();
    $pdf->Ln();
    $pdf->Line(14,114,197,114);
    $pdf->Line(14,115,197,115);
    $pdf->SetFont('Arial','B',9);
    $pdf->Cell(13,4 ,utf8_decode(get_translation_val($tlo, 'tbl_head_pos', $language_code)),0, 0, 'L');
    $pdf->Cell(96,4 ,utf8_decode(get_translation_val($tlo, 'tbl_head_desc', $language_code)),0, 0, 'L');
    $pdf->Cell(25,4 ,utf8_decode(get_translation_val($tlo, 'tbl_head_unit_price', $language_code)),0, 0, 'R');
    $pdf->Cell(25,4 ,utf8_decode(get_translation_val($tlo, 'tbl_head_qty', $language_code)),0, 0, 'R');
    $pdf->Cell(0,4 ,utf8_decode(get_translation_val($tlo, 'tbl_head_total', $language_code)),0, 0, 'R');
    $pdf->Ln();
    $pdf->SetFont('Arial','',7 );
    $pdf->Cell(13,4 ,utf8_decode(''),0, 0, 'L');
    $pdf->Cell(96,4 ,utf8_decode(''),0, 'L');
    $pdf->Cell(25,4 ,utf8_decode(get_translation_val($tlo, 'tbl_head_gross', $language_code)),0  , 0, 'R');
    $pdf->Cell(25   ,4 ,utf8_decode(''),0, 0, 'R');
    $pdf->Cell(0,4 ,utf8_decode(get_translation_val($tlo, 'tbl_head_gross', $language_code)),0, 0, 'R');
    $pdf->Ln(6);
    $pdf->SetFont('Arial','',9 );
    $pdf->Cell(13,5 ,utf8_decode('1'),0, 0, 'L');
    $pdf->SetFont('Arial','IB',9 );
    $pdf->Cell(96,5 ,utf8_decode(get_translation_val($tlo, 'tbl_item_line_1', $language_code)),0, 'L');
    $pdf->SetFont('Arial','',9 );
    $pdf->Cell(25,5 ,utf8_decode($tbl_single_price.' ').chr(128),0  , 0, 'R');
    $pdf->Cell(25   ,5 ,utf8_decode($tbl_qty),0, 0, 'R');
    $pdf->Cell(0,5 ,utf8_decode($tbl_total.' ').chr(128),0, 0, 'R');
    $pdf->Ln();
    $pdf->Cell(13,5 ,utf8_decode(''),0, 0, 'L');
    $pdf->Cell(96,5 ,utf8_decode(get_translation_val($tlo, 'tbl_item_line_2', $language_code)),0, 0, 'L');
    $pdf->Ln();
    $pdf->Cell(13,5 ,utf8_decode(''),0, 0, 'L');
    $pdf->Cell(96,5 ,utf8_decode(get_translation_val($tlo, 'tbl_item_line_3', $language_code)),0,0, 'L');
    $pdf->Line(14,145,197,145);
    $pdf->Ln(12);
    $pdf->Cell(135,5 ,utf8_decode(get_translation_val($tlo, 'tbl_sum_net_lbl', $language_code)),0   , 0, 'R');
    $pdf->Cell(0,5 ,utf8_decode($tbl_sum_net.' ').chr(128),0, 0, 'R');
    $pdf->Ln();
    $pdf->Cell(135,5 ,utf8_decode(get_translation_val($tlo, 'tbl_sum_tax_lbl', $language_code).$tbl_tax_rate.'%'),0   , 0, 'R');
    $pdf->Cell(0,5 ,utf8_decode($tbl_sum_tax.' ').chr(128),0, 0, 'R');
    $pdf->Ln();
    $pdf->Line(175,159,197,159);
    $pdf->Cell(135,5 ,utf8_decode(get_translation_val($tlo, 'tbl_sum_total_lbl', $language_code)),0   , 0, 'R');
    $pdf->SetFont('Arial','B',9 );
    $pdf->Cell(0,5 ,utf8_decode($tbl_sum_total.' ').chr(128),0, 0, 'R');
    $pdf->SetFont('Arial','',9 );
    $pdf->Line(175,164,197,164);
    $pdf->Line(175,165,197,165);
    $pdf->Ln(20);
    $pdf->Cell(0,4 ,utf8_decode($text_line_1),0, 1, 'L');
    $pdf->Cell(0,4 ,utf8_decode($text_line_2),0, 1, 'L');
    $pdf->Cell(0,4 ,utf8_decode($text_line_3),0, 1, 'L');
    $pdf->Ln();
    $pdf->Cell(0,4 ,utf8_decode(get_translation_val($tlo, 'regards_line_1', $language_code)),0, 1, 'L');
    $pdf->Cell(0,4 ,utf8_decode(get_translation_val($tlo, 'regards_line_2', $language_code)),0, 1, 'L');

    $pdf->Image('./src/logo_big-7.png', 75, 241   , 60, null,'PNG');
    $pdf->Ln(51);
    $pdf->SetFont('Arial','',7 );
    $pdf->Cell(0,3 ,utf8_decode('Komplexitäter UG (haftungsbeschränkt)'),0, 1, 'C');
    $pdf->Cell(0,3 ,utf8_decode('Registergericht: Amtsgericht Berlin Charlottenburg, HRB 201687 B'),0, 1, 'C');
    $pdf->Cell(0,3 ,utf8_decode('USt-IdNr: DE320946473'),0, 1, 'C');
    $pdf->Ln(10);
    $pdf->Line(14,272,197,272);
    $pdf->SetFont('Arial','I',9 );
    $pdf->Cell(0,4 ,utf8_decode(get_translation_val($tlo, 'account_details_lbl', $language_code)),0, 1, 'C');
    $pdf->SetFont('Arial','B',9 );
    $pdf->Cell(82,4 ,utf8_decode(get_translation_val($tlo, 'account_to_lbl', $language_code)),2, 0, 'L');
    $pdf->Cell(80,4 ,utf8_decode('IBAN '),0, 0, 'R');
    $pdf->Cell(100,4 ,utf8_decode('|   BIC'),0, 1, 'L');
    $pdf->SetFont('Arial','',9 );
    $pdf->Cell(82,4 ,utf8_decode('Komplexitäter UG (haftungsbeschränkt)'),2, 0, 'L');
    $pdf->Cell(80,4 ,utf8_decode('DE92 1001 7997 6157 2017 74 '),0, 0, 'R');
    $pdf->Cell(100,4 ,utf8_decode('|   HOLVDEB1'),0, 1, 'L');


    return $pdf->Output("", "S");
}

function sent_purchase_doc($email_address, $pdf_doc, $filename, $document_type, $language_code, $tlo) {


// email stuff (change data below)
    $to = $email_address;
    $from = _MAIL_REPLY_TO;

    if ($document_type == 'OFFER') {
        $subject = get_translation_val($tlo, 'mail_subject_offer', $language_code);
        $message =  get_translation_val($tlo, 'mail_msg_offer', $language_code);
    } else {
        $subject = get_translation_val($tlo, 'mail_subject_invoice', $language_code);
        $message =  get_translation_val($tlo, 'mail_msg_invoice', $language_code);
    }


// a random hash will be necessary to send mixed content
    $separator = md5(time());

// carriage return type (we use a PHP end of line constant)
    $eol = PHP_EOL;

// encode data (puts attachment in proper format)

    $attachment = chunk_split(base64_encode($pdf_doc));

// main header
    $headers = "From: " . $from . $eol;
    $headers .= "MIME-Version: 1.0" . $eol;
    $headers .= "Content-Type: multipart/mixed; boundary=\"" . $separator . "\"";

// no more headers after this, we start the body! //


// message
    $body  = "--" . $separator . $eol;
    $body .= "Content-Type: text/html; charset=\"utf-8\"" . $eol;
    $body .= "Content-Transfer-Encoding: 8bit" . $eol . $eol;
    $body .= $message . $eol;

// attachment
    $body .= "--" . $separator . $eol;
    $body .= "Content-Type: application/octet-stream; name=\"" . $filename . "\"" . $eol;
    $body .= "Content-Transfer-Encoding: base64" . $eol;
    $body .= "Content-Disposition: attachment" . $eol . $eol;
    $body .= $attachment . $eol;
    $body .= "--" . $separator . "--";

// send message
    mail($to, $subject, $body, $headers);

}


function generate_purchase_doc($link, $purchase_method, $language_code, $purchase_qty, $single_price
    , $purchase_address_arr, $email_address, $credit_id) {

    $sql = $link->prepare("SELECT current_value+1 document_number
                                               FROM kfs_sequences_tbl
                                              WHERE document_type=?
                                              FOR UPDATE");
    $sql->bind_param('s', $purchase_method);
    $sql->execute();
    $result = $sql->get_result();
    $document_number = $result->fetch_object()->document_number;
    $sql = $link->prepare("UPDATE kfs_sequences_tbl
                                                SET current_value = current_value+1
                                              WHERE document_type=?");
    $sql->bind_param('s', $purchase_method);
    $sql->execute();

    $tlo = get_translation_obj('document_php');
    $pdf_doc = create_purchase_doc($language_code, $purchase_qty, $single_price, $purchase_method
        , $purchase_address_arr, $email_address, $document_number, $tlo);

    $sql = $link->prepare("INSERT INTO kfs_documents_tbl(content, document_type, document_number
                                            , content_type) VALUES(?, ? ,? , 'pdf' )");

    $null = NULL;
    $sql->bind_param('bsi', $null, $purchase_method, $document_number);
    $sql->send_long_data(0, $pdf_doc);


    $sql->execute();

    $sql_text = null;
    if ($purchase_method == 'INVOICE') {
        $sql_text = "UPDATE kfs_credits_tbl 
                                    SET invoice_document_id = LAST_INSERT_ID() 
                                  WHERE credit_id = ?";
    }
    if ($purchase_method == 'OFFER') {
        $sql_text = "UPDATE kfs_credits_tbl 
                                    SET offer_document_id = LAST_INSERT_ID() 
                                  WHERE credit_id = ?";
    }

    if ($sql_text != null) {
        $sql = $link->prepare($sql_text);
        $sql->bind_param('i', $credit_id);
        $sql->execute();
    }

    $link->commit();

    sent_purchase_doc($email_address, $pdf_doc, $document_number . '.pdf'
        , $purchase_method, $language_code, $tlo);

}