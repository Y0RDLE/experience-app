import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export default function useArchiveSearch(searchQuery) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!searchQuery || searchQuery.trim() === '') {
        setResults([]);
        setTriggered(false);
        return;
      }

      setLoading(true);
      setTriggered(true);
      console.log('🔍 검색 시작:', searchQuery);

      try {
        const q = query(collection(db, 'experiences'), orderBy('company'));
        const snapshot = await getDocs(q);
        const allData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const filtered = allData.filter(
          (item) =>
            (item.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.region || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

        console.log('📦 결과:', filtered);
        setResults(filtered);
      } catch (err) {
        console.error('❌ 검색 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [searchQuery]);

  return { results, loading, triggered, setTriggered };
}
