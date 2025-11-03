/**
 * 海报生成服务
 * 通过 Netlify Function 调用火山引擎 API
 */

export interface GeneratePosterOptions {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  imageUrl?: string; // Base64 图片或 URL
  watermark?: boolean; // 是否添加水印
}

export interface GeneratePosterResponse {
  data: Array<{
    url?: string;
    b64_json?: string;
  }>;
  created: number;
}

/**
 * 生成海报
 */
export async function generatePoster(options: GeneratePosterOptions): Promise<GeneratePosterResponse> {
  const { 
    prompt, 
    model = 'doubao-seedream-4-0-250828',
    width = 1080,  // 竖版手机海报宽度
    height = 1920,  // 竖版手机海报高度 (9:16)
    imageUrl,
    watermark = false
  } = options;

  // 调用 Netlify Function
  const functionUrl = import.meta.env.DEV 
    ? 'http://localhost:8888/.netlify/functions/generate-poster'  // 本地开发
    : '/.netlify/functions/generate-poster';  // 生产环境

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      model,
      width,
      height,
      imageUrl,
      watermark,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '生成海报失败');
  }

  return response.json();
}

/**
 * 根据培训信息生成海报提示词
 */
export function generatePosterPrompt(training: {
  name: string;
  startDate: string;
  location: string;
  expertName?: string;
}): string {
  const { name, startDate, location, expertName } = training;
  
  const date = new Date(startDate).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let prompt = `专业培训海报设计，主题：${name}`;
  prompt += `，时间：${date}`;
  prompt += `，地点：${location}`;
  
  if (expertName) {
    prompt += `，讲师：${expertName}`;
  }

  prompt += `。要求：现代商务风格，简洁大气，蓝色主色调，包含培训主题、时间、地点等关键信息，专业排版`;

  return prompt;
}
