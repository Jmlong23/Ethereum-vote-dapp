pragma solidity >=0.4.21 <0.7.0;


contract vote{
    
    //["0xd4967590eb024589dfb6b9e48a576eb49ebc19d764b0d1d67dc21975e7258e97","0xd5967590eb024589dfb6b9e48a576eb49ebc19d764b0d1d67dc21975e7258e98"]
    // 这里声明了一个新的复合类型用于稍后的变量
    // 它用来表示一个选民
    struct Voter {
        bool voted;  // 若为真，代表该人已投票
        uint vote;   // 投票提案的索引
    }

    // 提案的类型
    struct Proposal {
        bytes32 name;   // 简称（最长32个字节）
        uint voteCount; // 得票数
    }
    
    address public chairperson;

    // 这声明了一个状态变量，为每个可能的地址存储一个 `Voter`。
    mapping(address => Voter) public voters;


    
    // 一个 `Proposal` 结构类型的动态数组
    Proposal[] public proposals;
    address[] public addressArray;
    bytes32[] public proNames;
    uint proNamesLength = 0;
    int8 public setarraysuccessful = -1; // 1 success, 0 fail, -1 not yet tried

    /// 为 `proposalNames` 中的每个提案，创建一个新的（投票）表决
    constructor() public {
        chairperson = msg.sender;
    }
    
    function createProposal(bytes32[] proposalNames) public{
        setarraysuccessful = 0;
        require(
            msg.sender == chairperson,
            "Only chairperson can create Proposal"
        );
        
        //对于提供的每个提案名称，
        //创建一个新的 Proposal 对象并把它添加到数组的末尾。
        delete proposals;
        for(uint j = 0; j < addressArray.length; j++){
            voters[addressArray[j]].voted = false;
        }
        delete addressArray;
        delete proNames;
        for (uint i = 0; i < proposalNames.length; i++) {
            // `Proposal({...})` 创建一个临时 Proposal 对象，
            // `proposals.push(...)` 将其添加到 `proposals` 的末尾
            proposals.push(Proposal({
                name: proposalNames[i],
                voteCount: 0
            }));
            proNames.push(proposalNames[i]);
        }
        proNamesLength = proNames.length;
        setarraysuccessful = 1;
    }
    
    
    /// 投给提案 `proposals[proposal].name`.
    function voteForCandidate(uint proposal) public {
        Voter storage sender = voters[msg.sender];
        require(!sender.voted, "Already voted.");
        addressArray.push(msg.sender);
        sender.voted = true;
        sender.vote = proposal;

        // 如果 `proposal` 超过了数组的范围，则会自动抛出异常，并恢复所有的改动
        proposals[proposal].voteCount += 1;
    }

    //返回投票人的状态
    function isVoted(address sender) public view
            returns (bool)
    {
       return voters[sender].voted;
    }
    function getArraySettingResult() public view returns (int8)
    {
    	return setarraysuccessful;
    }
    //返回候选人票数
    function proCount(uint proposal) public view
            returns (uint)
    {
       return proposals[proposal].voteCount;
    }

    function getNamesLength() public view
            returns (uint)
    {
       return proNamesLength;
    }

    function getName(uint x) public view
            returns (bytes32)
    {
       return proNames[x];
    }

    function getAUse() public view
            returns (address)
    {
       return chairperson;
    }
    /// @dev 结合之前所有的投票，计算出最终胜出的提案
    function winningProposal() public view
            returns (uint winningProposal_)
    {
        uint winningVoteCount = 0;
        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }

    // 调用 winningProposal() 函数以获取提案数组中获胜者的索引，并以此返回获胜者的名称
    function winnerName() public view
            returns (bytes32 winnerName_)
    {
        winnerName_ = proposals[winningProposal()].name;
    }
    
    function winnerCount() public view
            returns (uint voteCount_)
    {
        voteCount_ = proposals[winningProposal()].voteCount;
    }
}