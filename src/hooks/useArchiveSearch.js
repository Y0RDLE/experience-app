// src/hooks/useArchiveSearch.js
import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';

export default function useArchiveSearch(searchQuery) {
  const [results, setResults] = useState([]); // 전체 검색 결과
  const [loading, setLoading] = useState(false); // 로딩 상태
  const [triggered, setTriggered] = useState(false); // 사이드바에서 검색창을 띄우기 위한 트리거

  useEffect(() => {
    if (!searchQuery) {
      setResults([]);
      return;
    }

    setLoading(true);
    setTriggered(true); // 사이드바 검색이 발생하면 검색창 열기 트리거 활성화

    const fetch = async () => {
      try {
        const q = query(
          collection(db, 'experiences'),
          orderBy('company') // ✅ where 조건 제거하고 전체 company 기준 정렬
        );

        const snapshot = await getDocs(q);
        const qLower = searchQuery.toLowerCase();

        const filtered = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(doc =>
            doc.company?.toLowerCase().includes(qLower) ||
            doc.region?.toLowerCase().includes(qLower)
          )
          .sort((a, b) => {
            const aMatchCompany = a.company?.toLowerCase().includes(qLower);
            const bMatchCompany = b.company?.toLowerCase().includes(qLower);
            if (aMatchCompany && !bMatchCompany) return -1;
            if (!aMatchCompany && bMatchCompany) return 1;
            return 0;
          });

        setResults(filtered);
      } catch (err) {
        console.error('검색 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [searchQuery]);

  return { results, loading, triggered, setTriggered }; // 트리거 포함하여 반환
}
