/**
 * 批量为页面添加移动端支持
 * 包括：透明遮罩层和移动端菜单按钮
 */

const fs = require('fs');
const path = require('path');

// 需要添加移动端支持的页面列表
const pagesToUpdate = [
  'CustomerManagement.tsx',
  'ExpertManagement.tsx', 
  'TrainingPerformance.tsx',
  'TrainingManagement.tsx',
  'SalesTracking.tsx',
  'SalesPersonManagement.tsx',
  'ProspectusManagement.tsx',
  'ProfileSettings.tsx',
  'PosterGenerator.tsx',
  'PermissionManagement.tsx',
  'NotificationCenter.tsx',
  'DataManagement.tsx',
  'DataExport.tsx',
  'Dashboard.tsx',
  'AnnouncementManagement.tsx',
  'AnnouncementList.tsx'
];

const pagesDir = path.join(__dirname, '../src/pages');

// 检查页面是否已经有移动端支持
function hasMenuIcon(content) {
  return content.includes('from \'lucide-react\'') && content.includes('Menu');
}

function hasOverlay(content) {
  return content.includes('bg-opacity-0') && content.includes('lg:hidden');
}

function hasMobileButton(content) {
  return content.includes('lg:hidden') && content.includes('setSidebarOpen(true)');
}

// 添加 Menu 图标到导入
function addMenuImport(content) {
  const importRegex = /(import\s+{[^}]*})\s+from\s+'lucide-react'/;
  const match = content.match(importRegex);
  
  if (match) {
    const imports = match[1];
    if (!imports.includes('Menu')) {
      // 在最后一个图标后添加 Menu
      const newImports = imports.replace(/}$/, ', Menu}');
      return content.replace(importRegex, `${newImports} from 'lucide-react'`);
    }
  }
  
  return content;
}

// 添加透明遮罩层
function addOverlay(content) {
  const divRegex = /(\s*<div className="flex h-screen bg-gray-50 dark:bg-gray-900">\s*)/;
  
  if (content.match(divRegex)) {
    const overlay = `
      {/* 移动端遮罩层 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-0 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      `;
    
    return content.replace(divRegex, `$1${overlay}`);
  }
  
  return content;
}

// 添加移动端菜单按钮
function addMobileButton(content) {
  // 查找标题区域的模式
  const titlePatterns = [
    // 模式1：直接在标题前
    /(className="[^"]*text-\w*l[^"]*font-[^"]*[^>]*>)([^<]+)(</,
    // 模式2：在 flex items-center 内
    /(<div className="[^"]*flex[^"]*items-center[^"]*"[^>]*>\s*)/,
    // 模式3：在页面头部
    /(<h1[^>]*className="[^"]*text-[^"]*"[^>]*>)/
  ];

  const mobileButton = `
                {/* 移动端菜单按钮 */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg mr-3"
                >
                  <Menu size={24} />
                </button>`;

  for (const pattern of titlePatterns) {
    if (content.match(pattern)) {
      return content.replace(pattern, `$1${mobileButton}$2$3`);
    }
  }
  
  return content;
}

// 处理单个页面文件
function processPage(fileName) {
  const filePath = path.join(pagesDir, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ 文件不存在: ${fileName}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  console.log(`\n🔍 检查页面: ${fileName}`);
  
  // 检查当前状态
  const hasMenu = hasMenuIcon(content);
  const hasOverlayLayer = hasOverlay(content);
  const hasMobileBtn = hasMobileButton(content);
  
  console.log(`   Menu图标: ${hasMenu ? '✅' : '❌'}`);
  console.log(`   透明遮罩: ${hasOverlayLayer ? '✅' : '❌'}`);
  console.log(`   移动按钮: ${hasMobileBtn ? '✅' : '❌'}`);
  
  // 1. 添加 Menu 图标导入
  if (!hasMenu) {
    const newContent = addMenuImport(content);
    if (newContent !== content) {
      content = newContent;
      modified = true;
      console.log(`   ✅ 添加了 Menu 图标导入`);
    }
  }
  
  // 2. 添加透明遮罩层
  if (!hasOverlayLayer) {
    const newContent = addOverlay(content);
    if (newContent !== content) {
      content = newContent;
      modified = true;
      console.log(`   ✅ 添加了透明遮罩层`);
    }
  }
  
  // 3. 添加移动端菜单按钮（需要手动处理，因为位置各不相同）
  if (!hasMobileBtn) {
    console.log(`   ⚠️  需要手动添加移动端菜单按钮`);
  }
  
  // 保存修改
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`   💾 已保存修改到 ${fileName}`);
  } else {
    console.log(`   ℹ️  ${fileName} 无需修改`);
  }
}

// 主函数
function main() {
  console.log('🚀 开始批量添加移动端支持...\n');
  
  pagesToUpdate.forEach(processPage);
  
  console.log('\n✅ 批量处理完成！');
  console.log('\n📝 注意事项：');
  console.log('1. 透明遮罩层和Menu图标导入已自动添加');
  console.log('2. 移动端菜单按钮需要根据每个页面的布局手动添加');
  console.log('3. 请检查修改后的页面是否正常工作');
}

main();
