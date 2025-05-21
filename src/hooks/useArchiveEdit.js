import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-toastify';

export default function useArchiveEdit() {
  const [editTarget, setEditTarget] = useState(null);
  const [editValues, setEditValues] = useState({});

  const openEdit = (experience) => {
    setEditTarget(experience);
    setEditValues({ ...experience });
  };

  const closeEdit = () => {
    setEditTarget(null);
    setEditValues({});
  };

  const handleInputChange = (e) => {
    const { name, type, value, checked } = e.target;
    setEditValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const saveEdit = async () => {
    if (!editTarget?.id) return;
    try {
      await updateDoc(doc(db, 'experiences', editTarget.id), editValues);
      toast.success('요들의 외침! 수정 성공! 🎯');
      closeEdit();
    } catch (err) {
      console.error('수정 실패:', err);
      toast.error('요들의 외침! 수정 실패! 💥');
    }
  };

  return {
    editTarget,
    editValues,
    openEdit,
    closeEdit,
    handleInputChange,
    saveEdit,
  };
}
