import React, { useState, useEffect } from 'react';
import ExperienceCalendar from '@/components/ExperienceCalendar';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

export default function CalendarPage() {
  const [experiences, setExperiences] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const snapshot = await getDocs(collection(db, 'experiences'));
      setExperiences(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
    fetchData();
  }, []);

  return <ExperienceCalendar experiences={experiences} />;
}
