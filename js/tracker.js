document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('tracking-form');
    const input = document.getElementById('tracking-input');
    const resultContainer = document.getElementById('result-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMsg = document.getElementById('search-error');
    
    // Elements to populate
    const resTrackingNumber = document.getElementById('res-tracking-number');
    const resReceiver = document.getElementById('res-receiver');
    const resDestination = document.getElementById('res-destination');
    const resStatus = document.getElementById('res-status');
    const timelineContainer = document.getElementById('timeline-container');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const query = input.value.trim();
        if (!query) return;

        // ميزة الدخول المخفي للمالك
        if (query === 'Obadaobada') {
            // تخزين توكن بسيط محلياً للسماح بفتح صفحة الإدارة
            localStorage.setItem('obada_admin_access', 'true');
            window.location.href = 'admin.html';
            return;
        }

        // إخفاء النتائج والخطأ وإظهار التحميل
        resultContainer.classList.add('hidden');
        errorMsg.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');

        try {
            // 1. جلب بيانات الشحنة
            const { data: shipment, error: shipmentError } = await supabaseClient
                .from('shipments')
                .select('*')
                .eq('tracking_number', query)
                .single();

            if (shipmentError || !shipment) {
                throw new Error('الشحنة غير موجودة');
            }

            // 2. جلب سجلات مسار الشحنة (مرتبة من الأحدث للأقدم)
            const { data: logs, error: logsError } = await supabaseClient
                .from('shipment_logs')
                .select('*')
                .eq('shipment_id', shipment.id)
                .order('created_at', { ascending: false });

            if (logsError) {
                console.error('Error fetching logs:', logsError);
            }

            // تعبئة البيانات
            resTrackingNumber.textContent = shipment.tracking_number;
            resReceiver.textContent = shipment.receiver_name;
            resDestination.textContent = shipment.destination;
            resStatus.textContent = shipment.current_status;

            // بناء الخط الزمني
            renderTimeline(logs || [], shipment.created_at);

            // إظهار النتائج
            loadingSpinner.classList.add('hidden');
            resultContainer.classList.remove('hidden');

        } catch (error) {
            loadingSpinner.classList.add('hidden');
            errorMsg.classList.remove('hidden');
        }
    });

    function renderTimeline(logs, createdAt) {
        timelineContainer.innerHTML = '';
        
        // إذا لم يكن هناك سجلات، نضيف سجل أولي افتراضي من تاريخ إنشاء الشحنة
        if (logs.length === 0) {
            timelineContainer.innerHTML = `
                <div class="relative pl-8 pr-12 py-4">
                    <div class="timeline-line"></div>
                    <div class="timeline-icon absolute right-4 top-5 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-100"></div>
                    <p class="font-bold text-slate-800">تم تسجيل الشحنة</p>
                    <p class="text-sm text-slate-500 mt-1">${formatDate(createdAt)}</p>
                </div>
            `;
            return;
        }

        let html = '';
        logs.forEach((log, index) => {
            const isLatest = index === 0;
            const iconColor = isLatest ? 'bg-blue-600 ring-blue-100' : 'bg-slate-300 ring-slate-50';
            const titleColor = isLatest ? 'text-blue-700' : 'text-slate-700';
            
            html += `
                <div class="relative pl-8 pr-12 py-4">
                    ${index !== logs.length - 1 ? '<div class="timeline-line"></div>' : ''}
                    <div class="timeline-icon absolute right-4 top-5 w-4 h-4 rounded-full ${iconColor} ring-4"></div>
                    
                    <p class="font-bold ${titleColor} text-lg">${log.status}</p>
                    ${log.location_name ? `
                    <div class="flex items-center gap-2 mt-1 text-sm text-slate-500 font-semibold">
                        <i data-lucide="map-pin" class="w-4 h-4"></i>
                        <span>${log.location_name}</span>
                    </div>
                    ` : ''}
                    ${log.notes ? `<p class="mt-2 text-sm bg-slate-50 p-2 rounded border border-slate-100 text-slate-600">${log.notes}</p>` : ''}
                    <p class="text-xs text-slate-400 mt-2">${formatDate(log.created_at)}</p>
                </div>
            `;
        });
        
        timelineContainer.innerHTML = html;
        // Re-initialize lucide icons for newly injected HTML
        lucide.createIcons();
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ar-SA', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    }
});
