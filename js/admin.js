document.addEventListener('DOMContentLoaded', () => {
    // التحقق من الدخول السري
    if (localStorage.getItem('obada_admin_access') !== 'true') {
        alert('غير مصرح لك بالدخول');
        window.location.href = 'index.html';
        return;
    }

    // تسجيل الخروج
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('obada_admin_access');
        window.location.href = 'index.html';
    });

    // --- قسم إضافة الشحنة ---
    const addForm = document.getElementById('add-shipment-form');
    const trackingInput = document.getElementById('add-tracking');
    const receiverInput = document.getElementById('add-receiver');
    const destinationInput = document.getElementById('add-destination');
    const addBtn = document.getElementById('add-btn');
    const addMsg = document.getElementById('add-msg');

    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const tracking_number = trackingInput.value.trim();
        const receiver_name = receiverInput.value.trim();
        const destination = destinationInput.value.trim();

        if (!tracking_number || !receiver_name || !destination) return;

        addBtn.disabled = true;
        addBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> جاري الحفظ...';
        lucide.createIcons();

        try {
            // إدراج الشحنة
            const { data, error } = await supabaseClient
                .from('shipments')
                .insert([{ tracking_number, receiver_name, destination }])
                .select();

            if (error) {
                if (error.code === '23505') throw new Error('رقم التتبع موجود مسبقاً!');
                throw error;
            }

            // إدراج سجل أولي
            await supabaseClient
                .from('shipment_logs')
                .insert([{ 
                    shipment_id: data[0].id, 
                    location_name: 'مقر الشركة', 
                    status: 'تم الاستلام',
                    notes: 'تم تسجيل الشحنة في النظام'
                }]);

            showMessage(addMsg, 'تم إضافة الشحنة بنجاح!', 'text-green-600');
            addForm.reset();
        } catch (error) {
            console.error(error);
            showMessage(addMsg, error.message || 'حدث خطأ أثناء الحفظ', 'text-red-600');
        } finally {
            addBtn.disabled = false;
            addBtn.innerHTML = '<i data-lucide="save" class="w-4 h-4"></i> حفظ الشحنة';
            lucide.createIcons();
        }
    });

    // --- قسم تحديث مسار الشحنة ---
    const searchInput = document.getElementById('search-tracking-update');
    const searchBtn = document.getElementById('btn-search-update');
    const updateContainer = document.getElementById('update-form-container');
    const currentShipmentInfo = document.getElementById('current-shipment-info');
    const updateShipmentId = document.getElementById('update-shipment-id');
    const updateForm = document.getElementById('update-log-form');
    const updateBtn = document.getElementById('update-btn');
    const updateMsg = document.getElementById('update-msg');

    searchBtn.addEventListener('click', async () => {
        const query = searchInput.value.trim();
        if (!query) return;

        searchBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>';
        lucide.createIcons();

        try {
            const { data, error } = await supabaseClient
                .from('shipments')
                .select('*')
                .eq('tracking_number', query)
                .single();

            if (error || !data) throw new Error('الشحنة غير موجودة');

            // تفعيل نموذج التحديث
            updateContainer.classList.remove('hidden', 'opacity-50', 'pointer-events-none');
            updateContainer.classList.add('block');
            
            updateShipmentId.value = data.id;
            currentShipmentInfo.innerHTML = `شحنة: <strong>${data.tracking_number}</strong> | المستلم: ${data.receiver_name} <br> <span class="text-xs">الحالة الحالية: ${data.current_status}</span>`;
            
            showMessage(updateMsg, '', ''); // مسح الرسائل القديمة

        } catch (error) {
            alert(error.message);
            updateContainer.classList.add('opacity-50', 'pointer-events-none');
        } finally {
            searchBtn.innerHTML = 'بحث';
        }
    });

    updateForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const shipment_id = updateShipmentId.value;
        const status = document.getElementById('update-status').value;
        const notes = document.getElementById('update-notes').value.trim();
        const changeMainStatus = document.getElementById('change-main-status').checked;

        if (!shipment_id || !status) return;

        updateBtn.disabled = true;
        updateBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> جاري التحديث...';
        lucide.createIcons();

        try {
            // 1. إضافة سجل
            const { error: logError } = await supabaseClient
                .from('shipment_logs')
                .insert([{ shipment_id, status, location_name: '', notes }]);

            if (logError) throw logError;

            // 2. تحديث الحالة الرئيسية إن طُلب ذلك
            if (changeMainStatus) {
                const { error: updateError } = await supabaseClient
                    .from('shipments')
                    .update({ current_status: status })
                    .eq('id', shipment_id);
                
                if (updateError) throw updateError;
            }

            showMessage(updateMsg, 'تم إضافة السجل والتحديث بنجاح!', 'text-green-600');
            updateForm.reset();
            // إخفاء النموذج بعد نجاح التحديث بوقت قصير
            setTimeout(() => {
                updateContainer.classList.add('hidden', 'opacity-50', 'pointer-events-none');
                updateContainer.classList.remove('block');
                searchInput.value = '';
                currentShipmentInfo.innerHTML = 'شحنة: ---';
                updateMsg.classList.add('hidden');
            }, 3000);

        } catch (error) {
            console.error(error);
            showMessage(updateMsg, 'حدث خطأ أثناء التحديث', 'text-red-600');
        } finally {
            updateBtn.disabled = false;
            updateBtn.innerHTML = '<i data-lucide="send" class="w-4 h-4"></i> إضافة التحديث';
            lucide.createIcons();
        }
    });

    // دالة مساعدة لإظهار الرسائل
    function showMessage(element, text, colorClass) {
        element.textContent = text;
        element.className = `text-sm font-bold text-center mt-2 ${colorClass}`;
        element.classList.remove('hidden');
    }
});
