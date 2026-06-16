import toast from 'react-hot-toast';

const toastStyle = {
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  fontSize: '14px'
};

export const useToast = () => ({
  success: (msg) => toast.success(msg, { style: toastStyle }),
  error: (msg) => toast.error(msg, { style: toastStyle }),
  info: (msg) => toast(msg, { style: toastStyle }),
  promise: (promise, messages) => toast.promise(promise, messages, { style: toastStyle })
});

export default useToast;
