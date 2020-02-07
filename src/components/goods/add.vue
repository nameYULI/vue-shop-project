<template>
  <div>
    <!-- 面包屑导航区域 -->
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>商品管理</el-breadcrumb-item>
      <el-breadcrumb-item>添加商品</el-breadcrumb-item>
    </el-breadcrumb>
    <!-- 卡片视图区域 -->
    <el-card>
      <el-alert title="添加商品信息" type="info" show-icon center :closable="false"></el-alert>

      <!-- 步骤条区域   activeTndex-0 将activeIndex字符串转换成数字-->
      <el-steps :space="200" :active="activeIndex-0" finish-status="success" align-center>
        <el-step title="基本信息"></el-step>
        <el-step title="商品参数"></el-step>
        <el-step title="商品属性"></el-step>
        <el-step title="商品图片"></el-step>
        <el-step title="商品内容"></el-step>
        <el-step title="完成"></el-step>
      </el-steps>

      <!-- tab栏区域 -->
      <el-form
        :model="addForm"
        :rules="addFormRules"
        ref="addFormRef"
        label-width="100px"
        label-position="top"
      >
        <el-tabs
          v-model="activeIndex"
          :tab-position="'left'"
          :before-leave="beforeTabLeave"
          @tab-click="tabClicked"
        >
          <!-- el-tab-pane只可以做el-tabs的子节点 -->
          <el-tab-pane label="基本信息" name="0">
            <el-form-item label="商品名称" prop="goods_name">
              <el-input v-model="addForm.goods_name"></el-input>
            </el-form-item>
            <el-form-item label="商品价格" prop="goods_price">
              <el-input v-model="addForm.goods_price" type="number"></el-input>
            </el-form-item>
            <el-form-item label="商品重量" prop="goods_weight">
              <el-input v-model="addForm.goods_weight" type="number"></el-input>
            </el-form-item>
            <el-form-item label="商品数量" prop="goods_number">
              <el-input v-model="addForm.goods_number" type="number"></el-input>
            </el-form-item>
            <el-form-item label="商品分类" prop="goods_cat">
              <!-- 选择商品分类的级联选择框 -->
              <el-cascader
                v-model="addForm.goods_cat"
                :options="categoriesList"
                :props="cascaderProps"
                @change="categoriesChange"
                clearable
              ></el-cascader>
            </el-form-item>
          </el-tab-pane>
          <el-tab-pane label="商品参数" name="1">
            <!-- 渲染表单的item项 -->
            <el-form-item :label="item.attr_name" v-for="item in manyTabData" :key="item.attr_id">
              <!-- 复选框组 -->
              <el-checkbox-group v-model="item.attr_vals">
                <el-checkbox :label="cb" v-for="(cb,i) in item.attr_vals" :key="i" border></el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-tab-pane>
          <el-tab-pane label="商品属性" name="2">
            <el-form-item :label="item.attr_name" v-for="item in onlyTabData" :key="item.attr_id">
              <el-input v-model="item.attr_vals"></el-input>
            </el-form-item>
          </el-tab-pane>
          <el-tab-pane label="商品图片" name="3">
            <!-- action表示图片要上传到的后台API地址 -->
            <el-upload
              :action="uploadURL"
              :headers="headerObj"
              :on-preview="handlePreview"
              :on-remove="handleRemove"
              list-type="picture"
              :on-success="handleSuccess"
            >
              <el-button size="small" type="primary">点击上传</el-button>
            </el-upload>
          </el-tab-pane>
          <el-tab-pane label="商品内容" name="4">
            <quill-editor v-model="addForm.goods_introduce"></quill-editor>
            <!-- 添加按钮 -->
            <el-button class="btnAdd" type="primary" @click="addGoodsEvent">添加商品</el-button>
          </el-tab-pane>
        </el-tabs>
      </el-form>

      <!-- 图片预览的对话框 -->
      <el-dialog title="图片预览" :visible.sync="picDialogVisible" width="40%">
        <el-image :src="picSrc" :fit="scale-down"></el-image>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
import _ from 'lodash'

export default {
  data() {
    return {
      activeIndex: '0',
      addForm: {
        goods_name: '',
        goods_price: 0,
        goods_weight: 0,
        goods_number: 0,
        //商品所属分类数组
        goods_cat: [],
        //上传图片的临时地址
        pics: [],
        //商品的详情描述
        goods_introduce: '',
        attrs: []
      },
      addFormRules: {
        goods_name: [
          { required: true, message: '请输入商品名称', trigger: 'blur' }
        ],
        goods_price: [
          { required: true, message: '请输入商品价格', trigger: 'blur' }
        ],
        goods_weight: [
          { required: true, message: '请输入商品重量', trigger: 'blur' }
        ],
        goods_number: [
          { required: true, message: '请输入商品数量', trigger: 'blur' }
        ],
        goods_cat: [
          { required: true, message: '请输入选择商品分类', trigger: 'blur' }
        ]
      },
      //商品分类列表
      categoriesList: [],
      //指定级联选择器的配置对象
      cascaderProps: {
        expandTrigger: 'hover',
        value: 'cat_id',
        label: 'cat_name',
        children: 'children'
      },
      //商品参数列表
      manyTabData: [],
      //商品属性列表
      onlyTabData: [],
      //图片上传地址
      uploadURL: 'https://www.liulongbin.top:8888/api/private/v1/upload',
      //图片上传请求头
      headerObj: {
        Authorization: window.sessionStorage.getItem('token')
      },
      picDialogVisible: false,
      picSrc: ''
    }
  },
  created() {
    this.getCategoriesList()
  },
  methods: {
    //获取所有商品分类列表
    async getCategoriesList() {
      const { data: res } = await this.$http.get('categories')
      if (res.meta.status !== 200) {
        return this.$message.error('获取商品分类列表失败！')
      }
      this.categoriesList = res.data
    },

    //选择项发生变化时触发
    categoriesChange() {
      //限制只能选择第三级
      if (this.addForm.goods_cat.length !== 3) {
        this.addForm.goods_cat = []
        return
      }
    },
    beforeTabLeave(activeName, oldActiveName) {
      if (oldActiveName == '0' && this.addForm.goods_cat.length !== 3) {
        this.$message.error('请先选择商品分类！')
        return false
      }
    },
    async tabClicked() {
      //activeIndex===1证明访问的是商品参数面板
      if (this.activeIndex === '1') {
        const { data: res } = await this.$http.get(
          `categories/${this.categoriesId}/attributes`,
          {
            params: { sel: 'many' }
          }
        )
        if (res.meta.status !== 200) {
          return this.$message.error('获取商品参数列表失败！')
        }
        //字符串转换成数组
        res.data.forEach(item => {
          item.attr_vals =
            item.attr_vals.length === 0 ? [] : item.attr_vals.split(' ')
        })
        this.manyTabData = res.data
      }
      //activeIndex===2证明访问的是商品属性面板
      else if (this.activeIndex === '2') {
        const { data: res } = await this.$http.get(
          `categories/${this.categoriesId}/attributes`,
          {
            params: { sel: 'only' }
          }
        )
        if (res.meta.status !== 200) {
          return this.$message.error('获取商品属性列表失败！')
        }

        this.onlyTabData = res.data
      }
    },
    //处理图片预览效果
    handlePreview(file) {
      this.picSrc = file.response.data.url
      this.picDialogVisible = true
    },
    //处理移除图片的操作
    handleRemove(file) {
      //获取将要删除的图片的临时路经
      const filePath = file.response.data.tmp_path

      //从pics数组中找到这个临时路经对应的索引值
      const i = this.addForm.pics.findIndex(x => x.pic === filePath)
      //从数组中移除
      this.addForm.pics.splice(i, 1)
    },
    handleSuccess(responseData) {
      //拼接得到一个图片信息对象
      const picInfo = { pic: responseData.data.tmp_path }
      //将图片信息对象push到pics数组中
      this.addForm.pics.push(picInfo)
    },
    //添加商品
    async addGoodsEvent() {
      this.$refs.addFormRef.validate(async valid => {
        if (!valid) {
          return this.$message.error('请填写必要的表单项！')
        }
        //拼接前给addForm做一下深拷贝 lodash的cloneDeep(obj)方法
        const form = _.cloneDeep(this.addForm)
        form.goods_cat = form.goods_cat.join(',')

        //处理动态参数和静态属性
        this.manyTabData.forEach(item => {
          const newInfo = {
            attr_id: item.attr_id,
            attr_value: item.attr_vals.join(' ')
          }
          this.addForm.attrs.push(newInfo)
        })
        this.onlyTabData.forEach(item => {
          const newInfo = {
            attr_id: item.attr_id,
            attr_value: item.attr_vals
          }
          this.addForm.attrs.push(newInfo)
        })
        form.attrs = this.addForm.attrs

        //商品的名称必须是唯一的
        const { data: res } = await this.$http.post('goods', form)
        if (res.meta.status !== 201) {
          return this.$message.error('添加商品失败！')
        }

        this.$message.success('添加商品成功！')
        this.$router.push('/goods')
      })
    }
  },
  computed: {
    categoriesId() {
      if (this.addForm.goods_cat.length === 3) {
        return this.addForm.goods_cat[2]
      }
      return null
    }
  }
}
</script>

<style lang="less" scoped>
.el-checkbox {
  margin: 0 10px 0 0 !important;
}
.el-card {
  min-height: 500px;
}
.btnAdd {
  margin-top: 15px;
}
</style>