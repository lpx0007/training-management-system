import { Handler } from '@netlify/functions';

/**
 * Netlify Function: 生成海报
 * 使用火山引擎文生图 API
 */
export const handler: Handler = async (event) => {
  // 只允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // 解析请求参数
    const body = JSON.parse(event.body || '{}');
    const { 
      prompt, 
      model = 'doubao-seedream-4-0-250828', 
      width = 1080,
      height = 1920,
      imageUrl,
      watermark = false
    } = body;

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: '缺少 prompt 参数' }),
      };
    }

    // 从环境变量获取 API 密钥
    const apiKey = process.env.VOLCENGINE_API_KEY;
    
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: '服务器配置错误：缺少 API 密钥' }),
      };
    }

    // 验证尺寸范围（根据火山引擎文档）
    const minSize = 512;
    const maxSize = 2048;
    
    if (width < minSize || width > maxSize || height < minSize || height > maxSize) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: `图片尺寸必须在 ${minSize}-${maxSize} 像素之间`,
          details: `当前尺寸: ${width}x${height}`
        }),
      };
    }

    // 构建请求体
    const requestBody: any = {
      model,
      prompt,
      width,
      height,
      response_format: 'url',
      stream: false,
      watermark,
    };

    // 如果有图片，添加到请求中（支持图文混合输入）
    if (imageUrl) {
      requestBody.image_url = imageUrl;
    }

    // 调用火山引擎 API
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('火山引擎 API 错误:', errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: '调用火山引擎 API 失败',
          details: errorText 
        }),
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error('生成海报失败:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: '生成海报失败',
        message: error instanceof Error ? error.message : '未知错误'
      }),
    };
  }
};
