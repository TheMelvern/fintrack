<template>
  <div class="calculator-overlay" @click="handleOverlayClick">
    <div class="amount-calculator glass-card" @click.stop>
      <div class="calculator-header">
        <span class="title">{{ title }}</span>
        <button class="close-btn" @click="close">✕</button>
      </div>
      <div class="amount-display">
        <span class="currency">{{ currencySymbol }}</span>
        <span class="value">{{ displayValue }}</span>
      </div>
      <div class="keypad">
        <!-- Row 1 -->
        <div class="key-row">
          <button class="key" @click="appendNumber('1')">1</button>
          <button class="key" @click="appendNumber('2')">2</button>
          <button class="key" @click="appendNumber('3')">3</button>
          <button class="key operator" @click="setOperator('+')">+</button>
          <button class="key operator" @click="setOperator('×')">×</button>
        </div>
        <!-- Row 2 -->
        <div class="key-row">
          <button class="key" @click="appendNumber('4')">4</button>
          <button class="key" @click="appendNumber('5')">5</button>
          <button class="key" @click="appendNumber('6')">6</button>
          <button class="key operator" @click="setOperator('-')">-</button>
          <button class="key operator" @click="setOperator('÷')">÷</button>
        </div>
        <!-- Row 3 -->
        <div class="key-row">
          <button class="key" @click="appendNumber('7')">7</button>
          <button class="key" @click="appendNumber('8')">8</button>
          <button class="key" @click="appendNumber('9')">9</button>
          <button class="key" @click="clearEntry">C</button>
          <button class="key" @click="clearAll">AC</button>
        </div>
        <!-- Row 4: . 0 ⌫ = Done -->
        <div class="key-row">
          <button class="key" @click="appendDecimal">.</button>
          <button class="key" @click="appendNumber('0')">0</button>
          <button class="key" @click="backspace">⌫</button>
          <button class="key equal" @click="compute">=</button>
          <button class="key primary" @click="saveAndDone">Done</button>
        </div>
      </div>
      <div class="note-area">
        <input
          type="text"
          v-model="note"
          placeholder="Tap to add note"
          class="note-input"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Enter amount'
  },
  initialAmount: {
    type: Number,
    default: 0
  },
  currencySymbol: {
    type: String,
    default: '$'
  }
})

const emit = defineEmits(['save', 'close'])

// Calculator state
const currentValue = ref(props.initialAmount > 0 ? props.initialAmount : 0)
const previousValue = ref(0)
const currentOperator = ref(null)
const note = ref('')

const displayValue = computed(() => currentValue.value.toFixed(2))

// Append digit
function appendNumber(digit) {
  let str = currentValue.value.toString()
  if (str.includes('.')) {
    if (str.split('.')[1].length < 2) str += digit
  } else {
    if (str === '0') str = digit
    else str += digit
  }
  currentValue.value = parseFloat(str)
}

function appendDecimal() {
  let str = currentValue.value.toString()
  if (!str.includes('.')) {
    str += '.'
    currentValue.value = parseFloat(str)
  }
}

function clearEntry() {
  currentValue.value = 0
}

function clearAll() {
  currentValue.value = 0
  previousValue.value = 0
  currentOperator.value = null
}

function backspace() {
  let str = currentValue.value.toString()
  if (str.length === 1 || (str.length === 2 && str.startsWith('0'))) {
    currentValue.value = 0
  } else {
    str = str.slice(0, -1)
    currentValue.value = parseFloat(str)
  }
}

function setOperator(op) {
  if (currentOperator.value !== null) {
    compute()
  }
  previousValue.value = currentValue.value
  currentOperator.value = op
  currentValue.value = 0
}

function compute() {
  if (currentOperator.value === null) return
  let result = 0
  const prev = previousValue.value
  const curr = currentValue.value
  switch (currentOperator.value) {
    case '+':
      result = prev + curr
      break
    case '-':
      result = prev - curr
      break
    case '×':
      result = prev * curr
      break
    case '÷':
      result = curr === 0 ? 0 : prev / curr
      break
    default:
      result = curr
  }
  currentValue.value = result
  previousValue.value = 0
  currentOperator.value = null
}

function saveAndDone() {
  compute() // final computation
  const amount = parseFloat(currentValue.value)
  if (isNaN(amount)) return
  emit('save', { amount, note: note.value, close: true })
}

function close() {
  emit('close')
}

// Click outside to close
function handleOverlayClick() {
  close()
}

// Prevent background scroll when calculator is open
onMounted(() => {
  document.body.style.overflow = 'hidden'
})
onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.calculator-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.amount-calculator {
  position: relative;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-top-left-radius: 2rem;
  border-top-right-radius: 2rem;
  padding: 1rem 1rem 1.5rem;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
}

.calculator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 1.1rem;
  padding: 0 0.5rem;
  margin-bottom: 0.75rem;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}
.amount-display {
  text-align: right;
  font-size: 2.2rem;
  font-weight: 700;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 1.5rem;
  margin-bottom: 1rem;
}
.amount-display .currency {
  font-size: 1rem;
  margin-right: 0.25rem;
  color: #6b7280;
}
.keypad {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.key-row {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}
.key {
  flex: 1;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 2rem;
  padding: 0.75rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.1s;
  text-align: center;
  min-width: 60px;
}
.key:active {
  background: #f3f4f6;
  transform: scale(0.97);
}
.key.operator {
  background: #fef9c3;
  border-color: #facc15;
}
.key.equal {
  background: #dbeafe;
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.key.primary {
  background: var(--color-primary, #0058be);
  color: white;
  border: none;
}
.note-area {
  margin-top: 0.5rem;
}
.note-input {
  width: 100%;
  padding: 0.75rem;
  border-radius: 2rem;
  border: 1px solid #e5e7eb;
  background: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  outline: none;
}
.note-input:focus {
  border-color: var(--color-primary);
}
@media (max-width: 560px) {
  .amount-calculator {
    padding: 0.75rem;
  }
  .key {
    padding: 0.6rem 0;
    font-size: 1rem;
    min-width: 50px;
  }
  .amount-display {
    font-size: 1.8rem;
  }
}
</style>