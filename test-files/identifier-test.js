// 测试中文标识符和属性名提取
// 这个文件用于测试 AST 提取器是否能正确提取中文标识符和对象属性名

// 1. 中文变量名
const 用户 = {
  姓名: "张三",
  年龄: 25,
  职业: "开发工程师"
};

const 订单列表 = [];
const 当前状态 = "已完成";

// 2. 中文函数名
function 获取用户信息() {
  return "用户信息";
}

function 处理订单数据(订单参数) {
  return `处理订单: ${订单参数}`;
}

// 3. 中文对象属性
const 配置对象 = {
  系统设置: {
    主题颜色: "#1890ff",
    语言设置: "中文",
    自动保存: true
  },
  用户权限: {
    管理员权限: false,
    编辑权限: true,
    查看权限: true
  }
};

// 4. 中文类名
class 用户管理器 {
  constructor() {
    this.用户列表 = [];
    this.当前用户 = null;
  }
  
  添加用户(用户信息) {
    this.用户列表.push(用户信息);
  }
  
  获取用户(用户ID) {
    return this.用户列表.find(用户 => 用户.ID === 用户ID);
  }
}

// 5. 中文接口/类型定义（TypeScript）
interface 用户接口 {
  用户ID: string;
  用户名: string;
  邮箱地址: string;
  注册时间: Date;
}

type 订单状态 = "待处理" | "处理中" | "已完成" | "已取消";

// 6. 中文枚举
enum 权限类型 {
  只读权限 = "readonly",
  编辑权限 = "edit", 
  管理权限 = "admin",
  超级管理员 = "superadmin"
}

// 7. 混合场景
const 系统配置 = {
  数据库配置: {
    主机地址: "localhost",
    端口号: 3306,
    数据库名: "scrm_db"
  },
  缓存设置: {
    启用缓存: true,
    缓存时间: 3600,
    缓存类型: "redis"
  }
};

// 8. JSX 中的中文（这些应该被单独处理）
const 页面组件 = () => {
  return (
    <div>
      <h1>用户管理系统</h1>
      <button onClick={获取用户信息}>获取用户信息</button>
      <span>{当前状态}</span>
    </div>
  );
};

// 9. 导出中文标识符
export { 用户, 订单列表, 获取用户信息, 用户管理器, 系统配置 };
export default 用户管理器;
