-- التخلص من الجداول القديمة إذا كانت موجودة (اختياري)
DROP TABLE IF EXISTS shipment_logs;
DROP TABLE IF EXISTS shipments;

-- جدول الشحنات
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_number VARCHAR(255) UNIQUE NOT NULL,
    receiver_name VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    current_status VARCHAR(100) DEFAULT 'تم الاستلام' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول سجلات التحركات
CREATE TABLE shipment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    location_name VARCHAR(255) NOT NULL,
    status VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إعداد Row Level Security (RLS) للسماح بقراءة وتعديل البيانات
-- تحذير: في بيئة الإنتاج الفعلية يجب تطبيق سياسات أكثر أماناً، 
-- لكن لغرض البرنامج الحالي سنجعلها متاحة (بسبب استخدام Anon Key من المتصفح مباشرة)

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to shipments"
    ON shipments FOR SELECT USING (true);

CREATE POLICY "Allow public insert to shipments"
    ON shipments FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to shipments"
    ON shipments FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to shipment_logs"
    ON shipment_logs FOR SELECT USING (true);

CREATE POLICY "Allow public insert to shipment_logs"
    ON shipment_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete to shipments"
    ON shipments FOR DELETE USING (true);

CREATE POLICY "Allow public delete to shipment_logs"
    ON shipment_logs FOR DELETE USING (true);
