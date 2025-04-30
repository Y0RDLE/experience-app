import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { toast } from 'react-toastify';

export const useArchiveModal = () => {
  const [editTarget, setEditTarget] = useState(null);
  const [editValues, setEditValues] = useState({});

  const openModal = (experience) => {
    setEditTarget(experience);
    setEditValues({ ...experience });
  };

  const closeModal = () => {
    setEditTarget(null);
    setEditValues({});
  };

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setEditValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async () => {
    if (!editTarget?.id) return;
    try {
      await updateDoc(doc(db, 'experiences', editTarget.id), editValues);
      toast.success('요들의 외침! 수정 성공! 🎯');
      closeModal();
    } catch (err) {
      console.error(err);
      toast.error('요들의 외침! 수정 실패! 💥');
    }
  };

  return {
    editTarget,
    editValues,
    openModal,
    closeModal,
    handleChange,
    handleSave,
  };
};
