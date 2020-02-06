<template>
  <div>
    <!-- 面包屑导航区域 -->
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>商品管理</el-breadcrumb-item>
      <el-breadcrumb-item>商品分类</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 卡片视图区域 -->
    <el-card>
      <el-row>
        <el-col :span="4">
          <el-button type="primary" @click="showAddCategoriesDialog">添加分类</el-button>
        </el-col>
      </el-row>

      <!-- 商品列表区域 -->
      <tree-table
        class="treeTable"
        :data="categoriesList"
        :columns="categoriesColumns"
        :selection-type="false"
        :expand-type="false"
        :show-index="true"
        index-text="#"
        border
      >
        <!-- 是否有效的模板 -->
        <template slot="isok" slot-scope="scope">
          <i
            class="el-icon-success"
            v-if="scope.row.cat_deleted===false"
            style="color: rgb(32, 178, 170);"
          ></i>
          <i class="el-icon-error" v-else style="color:red"></i>
        </template>

        <!-- 排序的模板 -->
        <template slot="order" slot-scope="scope">
          <el-tag size="mini" v-if="scope.row.cat_level===0">一级</el-tag>
          <el-tag type="success" size="mini" v-if="scope.row.cat_level===1">二级</el-tag>
          <el-tag type="warning" size="mini" v-if="scope.row.cat_level===2">三级</el-tag>
        </template>

        <!-- 操作的模板 -->
        <template slot="operation" slot-scope="scope">
          <el-button
            type="primary"
            icon="el-icon-edit"
            size="mini"
            @click="showEditCategoriesDialog(scope.row.cat_id)"
          >编辑</el-button>
          <el-button
            type="danger"
            icon="el-icon-delete"
            size="mini"
            @click="deleteCategories(scope.row.cat_id)"
          >删除</el-button>
        </template>
      </tree-table>

      <!-- 分页区域 -->
      <el-pagination
        @current-change="handleCurrentChange"
        :current-page="queryInfo.pagenum"
        :page-sizes="[1, 2, 5, 10]"
        :page-size="queryInfo.pagesize"
        layout="total, prev, pager, next, jumper"
        :total="total"
      ></el-pagination>

      <!-- 添加分类的对话框 -->
      <el-dialog
        title="添加分类"
        :visible.sync="addCategoriesDialogVisible"
        width="40%"
        @close="addCategoriesDialogClosed"
      >
        <el-form
          :model="addCategoriesForm"
          :rules="addCategoriesRules"
          ref="addCategoriesFormRef"
          label-width="100px"
        >
          <el-form-item label="分类名称：" prop="cat_name">
            <el-input v-model="addCategoriesForm.cat_name"></el-input>
          </el-form-item>
          <el-form-item label="父级分类：">
            <el-cascader
              v-model="selectedKeys"
              :options="parentCategoriesList"
              :props="cascaderProps"
              @change="parentCategoriesChange"
              clearable
              collapse-tags
            ></el-cascader>
          </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button @click="addCategoriesDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="addCategories">确 定</el-button>
        </span>
      </el-dialog>

      <!-- 修改分类的对话框 -->
      <el-dialog
        title="添加分类"
        :visible.sync="editCategoriesDialogVisible"
        width="40%"
        @close="editCategoriesDialogClosed"
      >
        <el-form
          :model="editCategoriesForm"
          :rules="addCategoriesRules"
          ref="editCategoriesFormRef"
          label-width="100px"
        >
          <el-form-item label="分类名称：" prop="cat_name">
            <el-input v-model="editCategoriesForm.cat_name"></el-input>
          </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button @click="editCategoriesDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="editCategories">确 定</el-button>
        </span>
      </el-dialog>
    </el-card>
  </div>
</template>
<script>
export default {
  data() {
    return {
      //获取商品分类列表的参数对象
      queryInfo: {
        type: 3,
        pagenum: 1,
        pagesize: 5
      },
      total: 0,
      categoriesList: [],
      addCategoriesDialogVisible: false,
      addCategoriesForm: {
        cat_name: '',
        //父级分类的id
        cat_pid: 0,
        //分类的等级，默认添加一级分类
        cat_level: 0
      },
      addCategoriesRules: {
        cat_name: [
          { required: true, message: '请输入分类名称', trigger: 'blur' }
        ]
      },
      //父级分类列表
      parentCategoriesList: [],
      //指定级联选择器的配置对象
      cascaderProps: {
        expandTrigger: 'hover',
        checkStrictly: true,
        value: 'cat_id',
        label: 'cat_name',
        children: 'children'
      },

      //选中的父级分类的id数组
      selectedKeys: [],

      //表格各列配置
      categoriesColumns: [
        {
          label: '分类名称',
          prop: 'cat_name'
        },
        {
          label: '是否有效',
          //表示将当前列定义为模板列
          type: 'template',
          //表示当前这一列使用的模板名称
          template: 'isok'
        },
        {
          label: '排序',
          //表示将当前列定义为模板列
          type: 'template',
          //表示当前这一列使用的模板名称
          template: 'order'
        },
        {
          label: '操作',
          //表示将当前列定义为模板列
          type: 'template',
          //表示当前这一列使用的模板名称
          template: 'operation'
        }
      ],
      editCategoriesDialogVisible: false,
      editCategoriesForm: {}
    }
  },
  created() {
    this.getCategoriesList()
  },
  methods: {
    //获取商品列表
    async getCategoriesList() {
      const { data: res } = await this.$http.get('categories', {
        params: this.queryInfo
      })
      if (res.meta.status !== 200) {
        return this.$message.error('获取商品分类列表失败！')
      }
      this.categoriesList = res.data.result
      this.total = res.data.total
    },

    //监听 页码值 改变的事件
    handleCurrentChange(val) {
      // console.log(`当前页: ${val}`)
      this.queryInfo.pagenum = val
      this.getCategoriesList()
    },
    showAddCategoriesDialog() {
      this.getParentCategoriesList()
      this.addCategoriesDialogVisible = true
    },

    //获取父级分类的数据列表
    async getParentCategoriesList() {
      const { data: res } = await this.$http.get('categories', {
        params: {
          type: 2
        }
      })
      if (res.meta.status !== 200) {
        return this.$message.error('获取父级分类数据失败！')
      }
      this.parentCategoriesList = res.data
    },

    //选择项发生变化时触发
    parentCategoriesChange() {
      //如果selectKeys数组中的length>0，证明选中了父级分类
      //反之说明没有选择任何父级分类
      if (this.selectedKeys.length > 0) {
        //数组中的最后一项是所添加分类的父级分类id
        this.addCategoriesForm.cat_pid = this.selectedKeys[
          this.selectedKeys.length - 1
        ]

        //为当前分类的等级赋值
        this.addCategoriesForm.cat_level = this.selectedKeys.length
        return
      } else {
        this.addCategoriesForm.cat_pid = 0
        this.addCategoriesForm.cat_level = 0
      }
    },
    //监听对话框的关闭事件，重置表单数据
    addCategoriesDialogClosed() {
      this.$refs.addCategoriesFormRef.resetFields()
      this.selectedKeys = []
      this.addCategoriesForm.cat_level = 0
      this.addCategoriesForm.cat_pid = 0
    },

    //点击按钮添加新的分类
    addCategories() {
      this.$refs.addCategoriesFormRef.validate(async valid => {
        if (!valid) return
        const { data: res } = await this.$http.post(
          'categories',
          this.addCategoriesForm
        )
        if (res.meta.status !== 201) {
          return this.$message.error('添加分类失败！')
        }
        this.$message.success('添加分类成功！')
        this.getCategoriesList()

        this.addCategoriesDialogVisible = false
      })
    },

    //修改分类名称
    async showEditCategoriesDialog(id) {
      const { data: res } = await this.$http.get('categories/' + id)
      if (res.meta.status !== 200) {
        return this.$message.error('查询分类数据失败！')
      }
      this.editCategoriesForm = res.data
      this.editCategoriesDialogVisible = true
    },
    editCategoriesDialogClosed() {
      this.$refs.editCategoriesFormRef.resetFields()
    },

    //点击确认修改分类名称
    editCategories() {
      this.$refs.editCategoriesFormRef.validate(async valid => {
        if (!valid) return
        const { data: res } = await this.$http.put(
          'categories/' + this.editCategoriesForm.cat_id,
          { cat_name: this.editCategoriesForm.cat_name }
        )
        if (res.meta.status !== 200) {
          return this.$message.error('修改分类名称失败！')
        }
        this.editCategoriesDialogVisible = false
        this.getCategoriesList()
        this.$message.success('修改分类名称成功！')
      })
    },
    async deleteCategories(id) {
      const confirmResult = await this.$confirm(
        '此操纵将永久删除该商品分类，是否继续？',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).catch(err => err)
      if (confirmResult !== 'confirm') {
        return this.$message.info('已取消删除')
      }
      const { data: res } = await this.$http.delete('categories/' + id)
      if (res.meta.status !== 200) {
        return this.$message.error('删除角色失败')
      }
      this.$message.success('删除成功!')
      this.getCategoriesList()
    }
  }
}
</script>
<style lang="less" scoped>
.treeTable {
  margin-top: 15px;
  font-size: 12px;
}
.el-cascader {
  width: 100%;
}
</style>