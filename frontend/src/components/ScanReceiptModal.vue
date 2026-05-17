<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="bottom-sheet">
      <!-- Drag Handle (Mobile only) -->
      <div class="drag-handle">
        <div class="handle-bar"></div>
      </div>

      <!-- Header -->
      <div class="sheet-header">
        <h2 class="sheet-title">Add Transaction</h2>
        <button class="close-btn" @click="closeModal">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <!-- Step 1: Choose method (3‑column grid) -->
      <div v-if="step === 'choose'" class="sheet-content">
        <div class="options-grid">
          <button class="option-card" @click="step = 'camera'">
            <div class="option-icon">
              <span class="material-symbols-outlined">photo_camera</span>
            </div>
            <span class="option-label">Take Photo</span>
          </button>
          <button class="option-card" @click="step = 'upload'">
            <div class="option-icon">
              <span class="material-symbols-outlined">upload_file</span>
            </div>
            <span class="option-label">Upload Receipt</span>
          </button>
          <button class="option-card" @click="enterManually">
            <div class="option-icon">
              <span class="material-symbols-outlined">edit_document</span>
            </div>
            <span class="option-label">Enter Manually</span>
          </button>
        </div>
      </div>

      <!-- Step 2a: Camera / Upload (image capture) -->
      <div v-else-if="step === 'camera' || step === 'upload'" class="sheet-content">
        <div v-if="!imagePreview" class="image-picker">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            :capture="step === 'camera' ? 'environment' : undefined"
            class="file-input"
            @change="onFileSelected"
          />
          <button class="action-btn primary" @click="triggerFileInput">
            <span class="material-symbols-outlined">
              {{ step === 'camera' ? 'photo_camera' : 'upload_file' }}
            </span>
            {{ step === 'camera' ? 'Take Photo' : 'Choose Image' }}
          </button>
          <p class="hint">{{ step === 'camera' ? 'Take a photo of your receipt' : 'Upload a receipt image (JPEG/PNG)' }}</p>
          <button class="back-btn" @click="step = 'choose'">← Back</button>
        </div>
        <div v-else class="preview-area">
          <img :src="imagePreview" alt="Receipt preview" class="preview-img" />
          <div v-if="isProcessing" class="processing">
            <span class="material-symbols-outlined spin">sync</span>
            <p>Extracting data...</p>
          </div>
          <button v-if="!isProcessing" class="back-btn" @click="resetImage">Take another</button>
        </div>
      </div>

      <!-- Extracted data confirmation (for camera/upload) -->
      <div v-if="extractedData" class="sheet-content">
        <div class="extracted-info">
          <p><strong>Merchant:</strong> {{ extractedData.merchant }}</p>
          <p><strong>Amount:</strong> {{ formatCurrency(extractedData.amount) }}</p>
          <p><strong>Date:</strong> {{ extractedData.date }}</p>
          <p><strong>Category:</strong>
            <select v-model="extractedData.category_id">
              <option v-for="cat in expenseCategories" :key="cat.cat_id" :value="cat.cat_id">
                {{ cat.cat_name }}
              </option>
            </select>
          </p>
        </div>
        <div class="form-actions">
          <button class="cancel-btn" @click="resetAndClose">Cancel</button>
          <button class="save-btn" @click="addTransaction">Add Transaction</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFinanceStore } from '../stores/finance'
import { usePreferenceStore } from '../stores/preferences'

const router = useRouter()
const props = defineProps({ isOpen: Boolean })
const emit = defineEmits(['close', 'transaction-added'])

const store = useFinanceStore()
const prefStore = usePreferenceStore()

// UI state
const step = ref('choose') // 'choose', 'camera', 'upload'
const fileInput = ref(null)
const imagePreview = ref(null)
const isProcessing = ref(false)
const extractedData = ref(null)

// Category lists (only expenses for receipt scanning)
const expenseCategories = computed(() => store.categories.filter(c => c.cat_parent === 'expense'))

const currencySymbol = computed(() => prefStore.preferences?.currencySymbol || '$')
const formatCurrency = (val) => `${currencySymbol.value}${val.toFixed(2)}`

const triggerFileInput = () => fileInput.value?.click()
const onFileSelected = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (event) => {
    imagePreview.value = event.target.result
    processImage(file)
  }
  reader.readAsDataURL(file)
}

const processImage = async (file) => {
  isProcessing.value = true
  // Mock OCR – replace with real API (e.g., Tesseract.js or backend service)
  setTimeout(() => {
    extractedData.value = {
      merchant: 'Sample Store',
      amount: Math.floor(Math.random() * 100) + 10,
      date: new Date().toISOString().split('T')[0],
      category_id: expenseCategories.value[0]?.cat_id || null,
    }
    isProcessing.value = false
  }, 1500)
}

const addTransaction = async () => {
  if (!extractedData.value) return
  await store.addTransaction({
    description: extractedData.value.merchant,
    amount: -extractedData.value.amount,
    category_id: extractedData.value.category_id,
    transaction_date: extractedData.value.date,
    is_recurring: false,
  })
  resetAndClose()
  emit('transaction-added')
}

// Redirect to the separate Add Transaction page
const enterManually = () => {
  closeModal()
  router.push('/add-transaction')
}

const resetImage = () => {
  imagePreview.value = null
  extractedData.value = null
  step.value = 'choose'
}

const resetAndClose = () => {
  imagePreview.value = null
  extractedData.value = null
  isProcessing.value = false
  step.value = 'choose'
  emit('close')
}

const closeModal = () => resetAndClose()
</script>

<style scoped>
/* Full-width, no‑gap bottom sheet – guaranteed to stretch edge-to-edge */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: stretch;
}

.bottom-sheet {
  width: 100%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 2rem 2rem 0 0;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
  padding-bottom: env(safe-area-inset-bottom);
  margin: 0;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.drag-handle {
  display: flex;
  justify-content: center;
  padding-top: 0.75rem;
  padding-bottom: 0.5rem;
}
.handle-bar {
  width: 2rem;
  height: 0.25rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 9999px;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.sheet-title {
  font-family: var(--font-family-headline);
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}
.close-btn {
  background: none;
  border: none;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s;
}
.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}
.close-btn .material-symbols-outlined {
  font-size: 1.5rem;
}

.sheet-content {
  padding: 1rem 1.5rem 2rem;
  max-height: 70vh;
  overflow-y: auto;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.option-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}
.option-card:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-2px);
}
.option-icon {
  width: 3.5rem;
  height: 3.5rem;
  background: rgba(0, 88, 190, 0.1);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
}
.option-icon .material-symbols-outlined {
  font-size: 1.75rem;
}
.option-label {
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
}

.image-picker, .preview-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
.file-input { display: none; }
.action-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 2rem;
  padding: 0.5rem 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}
.hint {
  font-size: 0.75rem;
  color: var(--color-on-surface-variant);
}
.back-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 0.875rem;
  text-decoration: underline;
}
.preview-img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 1rem;
}
.processing {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.extracted-info {
  background: rgba(255, 255, 255, 0.5);
  padding: 1rem;
  border-radius: 1rem;
  margin-bottom: 1rem;
}
.extracted-info p {
  margin: 0.5rem 0;
}
.extracted-info select {
  margin-left: 0.5rem;
  padding: 0.25rem;
  border-radius: 0.5rem;
}
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}
.cancel-btn, .save-btn {
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-weight: 600;
  cursor: pointer;
}
.cancel-btn {
  background: rgba(0, 0, 0, 0.05);
  border: none;
}
.save-btn {
  background: var(--color-primary);
  color: white;
  border: none;
}
</style>