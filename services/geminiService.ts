import { GoogleGenAI } from "@google/genai";
import { Person, TaskRecord } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDailyReport = async (
  date: string,
  members: Person[],
  records: Record<string, TaskRecord>
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Cannot generate report.";
  }

  // Construct a clear text representation of the data
  const dataDescription = members.map(p => {
    const record = records[p.id] || { completed: false, remarks: '' };
    return `- [${p.group}] ${p.name}: ${record.completed ? '완료' : '미완료'} ${record.remarks ? `(비고: ${record.remarks})` : ''}`;
  }).join('\n');

  const prompt = `
    다음은 ${date}의 팀 업무 현황 리스트입니다.
    이 데이터를 바탕으로 간단하고 명확한 일일 브리핑 보고서를 작성해주세요.
    
    데이터:
    ${dataDescription}

    요구사항:
    1. 전체 완료율을 언급하세요.
    2. 미완료된 인원이 있다면 그룹별로 정리해서 알려주세요.
    3. 특이사항(비고)이 있는 인원에 대해 요약해주세요.
    4. 한국어로 정중한 어조(해요체)를 사용해주세요.
    5. Markdown 포맷을 사용하지 말고 일반 텍스트로 주세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "리포트를 생성할 수 없습니다.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
};