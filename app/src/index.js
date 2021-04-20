import "./style.css";
import Web3 from "web3";
import vote from "../../build/contracts/vote.json";
var candidateNames = new Array();
var candidate;
var candiateCount = new Array();
var candidateLength = 0;
const App = {
  web3: null,
  account: null,
  vote: null,
  chairAccount:null,
  accounts:null,

  start: async function() {
    const { web3 } = this;

    try {

      const networkId = await web3.eth.net.getId();
      const deployedNetwork = vote.networks[networkId];

      this.vote = new web3.eth.Contract(
        vote.abi,
        deployedNetwork.address,
      );

      this.accounts = await web3.eth.getAccounts();
      this.account = this.accounts[0];
      $("#account").html("当前账户："+this.account.toString());
      
      const { getAUse } = this.vote.methods;
      this.chairAccount = await getAUse().call();
      $("#chairAccount").html("管理员账户："+this.chairAccount.toString());

      const { isVoted } = this.vote.methods;
      var jude = await isVoted(this.account).call();
      if(jude == true){
        $("#isVoted").html("你已经投过票了，无须再投票");
      }
      else{
        $("#isVoted").html("你还没投过票了，请为心仪的选项投上宝贵的一票");
      }

      
      this.refreshAccount();
      this.refreshVotes();
      this.getResult();
    } catch (error) {
      console.error("Could not connect to contract or chain.");
    }
  },
  changeAccount: async function(){
    var myselect=document.getElementById("selectAccount");
    
    var index=myselect.selectedIndex;
    console.log(index);
    this.account = this.accounts[index];
    $("#account").html("当前账户："+this.account.toString());

    const { isVoted } = this.vote.methods;
    var jude = await isVoted(this.account).call();
    if(jude == true){
      $("#isVoted").html("你已经投过票了，无须再投票");
    }
    else{
      $("#isVoted").html("你还没投过票了，请为心仪的选项投上宝贵的一票");
    }
  },
  refreshAccount: async function(){
    var selectText = "";
    for(var i = 0; i < 10; i++){
      selectText+="<option >" + this.accounts[i] + "</option>";
    }
    $("#selectAccount").html(selectText);
  },
  refreshVotes: async function() {
    const { web3 } = this;
    try{
      const{ getNamesLength } = this.vote.methods;
      candidateLength = await getNamesLength().call();
      const { getName } = this.vote.methods;
      var tableData = "";
      for (var i = 0; i < candidateLength; i++) {
        const canNames = await getName(parseInt(i)).call();
        const strName = web3.utils.hexToAscii(canNames);
        candidateNames[i] = strName;
        tableData+="<input type='checkbox' name='vo'>" + strName + "</br>";   
      } 

      //现在tableData已经生成好了，把他赋值给上面的tbody
      $("#tbody1").html(tableData);

    }catch(e){
      console.error(e);
    }
  },

  getResult: async function() {
    //this.refreshVotes();
    const { web3 } = this;
    try{
      const{ getNamesLength } = this.vote.methods;
      candidateLength = await getNamesLength().call();
      const { getName } = this.vote.methods;
      const { proCount } = this.vote.methods;
      for (var i = 0; i < candidateLength; i++) {
        const canNames = await getName(parseInt(i)).call();
        const strName = web3.utils.hexToAscii(canNames);
        candidateNames[i] = strName;   
        const value = await proCount(parseInt(i)).call();
        candiateCount[i] = parseFloat(value);
      } 
    }catch(e){
      console.error(e);
    }
    console.log(candiateCount);
    console.log(candidateNames);
    var chart = {
      type: 'column'
      };
      var title = {
          text: '投票结果统计'   
      };
      var subtitle = {
          text: ''  
      };
      var xAxis = {
          categories: candidateNames,
          crosshair: true,
          title: {
            enabled: true,
            text: '票数 (张)' ,   
				    text: '<b>候选人</b>'       
          } 
      };
      var yAxis = {
          min: 0,
          title: {
          text: '票数 (张)'         
          }      
      };
      var tooltip = {
          headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
          pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
          '<td style="padding:0"><b>{point.y:.1f} 张</b></td></tr>',
          footerFormat: '</table>',
          shared: true,
          useHTML: true
      };
      var plotOptions = {
          column: {
          pointPadding: 0.2,
          borderWidth: 0
          }
      };  
      var credits = {
          enabled: false
      };
      
      var series= [{
          name: '',
          data: candiateCount
          }];     
      var json = {};   
      json.chart = chart; 
      json.title = title;   
      json.subtitle = subtitle; 
      json.tooltip = tooltip;
      json.xAxis = xAxis;
      json.yAxis = yAxis;  
      json.series = series;
      json.plotOptions = plotOptions;  
      json.credits = credits;
      $('#containerResult').highcharts(json);
      const { winningProposal } = this.vote.methods;
      var winIndex = await winningProposal().call();

      const{ winnerCount } = this.vote.methods;
      var winCount = await winnerCount().call();
      var winStr = "<tr> <td>" + candidateNames[winIndex] +"</td><td>" + winCount + "</td></tr>";
      $("#tbodyWin").html(winStr);

  },
  createVote:async function(){
    const { web3 } = this;
    try{
      if(this.account != this.chairAccount){
        alert("只有管理员可以发起投票");
      }
      else{
        var str = $("#creatVote").val();
        $("#creatVote").val('');
        candidate = str.split(',');
        var candidateByte32Array=new Array();
        for(var i = 0; i < candidate.length; i++){
          candidateByte32Array[i] = web3.utils.toHex(candidate[i]);
        }
        
        console.log(candidateByte32Array);
        const {createProposal} = this.vote.methods;
        await createProposal(candidateByte32Array).send({ from: this.account,gas: 6721975, gasPrice: '30000000' });
        
        //判断发起投票是否成功
        //const {getArraySettingResult} = this.vote.methods;
        // const isTrue = await getArraySettingResult().call();
        // if(isTrue == 1){
        //   alert("你已成功发起投票");
        // }else{
        //   alert("发起投票失败");
        // }
        this.refreshVotes();
      }
    }catch(err){
      console.error(err);
      alert("输入格式不对");
    }
  },
  voteForCandidate: async function() {
    const { web3 } = this;
    var voteText = "";
    try{
      var obj = document.getElementsByName("vo");
      var count = 0;
      var checked = 0;
      for(var x = 0; x < obj.length; x++){
        if(obj[x].checked) {
          count++;
          checked = x;
        }
      }
      if(count != 1) {
        voteText += "<p>只能选中其中一项才能投票</p>" ;
        voteText += "<p>请重新选择再投票</p>" ;
        voteText += "<p>投票失败！！！</p>" ;
        $("#voteText").html(voteText);
      }
      else{
        const { voteForCandidate } = this.vote.methods;
        console.log(this.vote.methods);
        await voteForCandidate(parseInt(checked)).send({ from: this.account,gas: 6721975, gasPrice: '30000000' });
        voteText += "<p>正在把你的选票录入区块链中……</p>" ;
        voteText += "<p>感谢你投上宝贵的一票</p>" ;
        voteText += "<p>恭喜你！！！投票成功！！！</p>" ;
        $("#voteText").html(voteText);
        $("#isVoted").html("你已经投过票了，无须再投票");
      }

    }catch(err){
      console.error(err);
      voteText += "<p>你已经投过票了</p>" ;
      voteText += "<p>无须再进行投票哦</p>" ;
      voteText += "<p>投票失败！！！</p>" ;
      $("#voteText").html(voteText);
    }
  },
};

window.App = App;

window.addEventListener("load", function() {
  if (0) {
    // use MetaMask's provider
    App.web3 = new Web3(window.ethereum);
    window.ethereum.enable(); // get permission to access accounts
  } else {
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(
      new Web3.providers.HttpProvider("http://127.0.0.1:8545"),
    );

  }

  App.start();
  //App.getResult();
});
