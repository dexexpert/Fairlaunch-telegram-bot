// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

pragma solidity ^0.8.0;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Returns the number of decimals.
     */
    function decimals() external view returns (uint256);

    /**
     * @dev Returns the name of token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

library UniswapV2Library {
    // returns sorted token addresses, used to handle return values from pairs sorted in this order
    function sortTokens(
        address tokenA,
        address tokenB
    ) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, "UniswapV2Library: IDENTICAL_ADDRESSES");
        (token0, token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);
        require(token0 != address(0), "UniswapV2Library: ZERO_ADDRESS");
    }

    // calculates the CREATE2 address for a pair without making any external calls
    function pairFor(
        address factory,
        address tokenA,
        address tokenB
    ) internal pure returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        pair = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            hex"ff",
                            factory,
                            keccak256(abi.encodePacked(token0, token1)),
                            hex"96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f" // init code hash
                        )
                    )
                )
            )
        );
    }
}

contract FairLaunchFactory is Ownable {
    struct PoolInfo {
        address poolAddress;
        IERC20 tokenAddress;
        uint256 sellAmount;
        uint acceptedTokens;
        uint256 softcap;
        uint256 startTime;
        uint256 endTime;
        uint256 minimumBuyAmount;
        uint256 maximumBuyAmount;
        uint256 lockupPeriod;
        uint256 liquidityPercentage;
        uint256 referralPercentage; // %
        bool _isPancakeRouter;
        bool _whitelistEnabled;
    }

    modifier onlyManager() {
        require(msg.sender == owner() || msg.sender == managerWallet);
        _;
    }

    event poolCreated(address poolAddress, address deployerAddress);

    mapping(address => address[]) public launchPools;

    address public managerWallet = owner();
    uint256 public poolCreationFee = 1 ether;

    constructor() {
    }

    function setPoolCreationFee(uint256 _poolCreationFee) external onlyOwner {
        poolCreationFee = _poolCreationFee;
    }

    // required token amount

    //token + 0.955 * liquidity percentage * token / 1000
    //token's 2 % + 0.98 * liquidityPercentage * token / 100
    function createPool(
        PoolInfo memory _poolInfo,
        address[] memory _whitelistAddresses
    ) external payable returns (address) {
        require(msg.value >= poolCreationFee, "insufficient deposit fee");
        FairLaunch newPool = new FairLaunch(address(this));
        newPool.initialize(
            _poolInfo.tokenAddress,
            _poolInfo.sellAmount,
            _poolInfo.acceptedTokens,
            _poolInfo.softcap,
            _poolInfo.startTime,
            _poolInfo.endTime
        );
        newPool.initialize1(
            _poolInfo.minimumBuyAmount,
            _poolInfo.maximumBuyAmount,
            _poolInfo.lockupPeriod,
            _poolInfo.liquidityPercentage,
            _poolInfo.referralPercentage,
            _poolInfo._isPancakeRouter,
            _poolInfo._whitelistEnabled
        );
        if (_poolInfo._whitelistEnabled == true) {
            newPool.whitelistInitialize(_whitelistAddresses);
        }
        newPool.transferOwnership(msg.sender);
        _poolInfo.tokenAddress.transferFrom(
            msg.sender,
            address(newPool),
            calcRequiredTokenAmount(
                _poolInfo.sellAmount,
                _poolInfo.liquidityPercentage
            )
        );

        // poolInfos.push(_poolInfo);
        launchPools[address(_poolInfo.tokenAddress)].push(address(newPool));

        emit poolCreated(address(newPool), msg.sender);

        return address(newPool);
    }

    function calcRequiredTokenAmount(
        uint256 _tokenAmount,
        uint256 _liquidityPercentage
    ) public pure returns (uint256 _amount) {
        return
            _tokenAmount +
            (955 * _liquidityPercentage * _tokenAmount) /
            100 /
            1000;
    }

    function claimFees() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function withdrawTokenFees(IERC20 _tokenAddress) external onlyOwner {
        _tokenAddress.transfer(
            msg.sender,
            _tokenAddress.balanceOf(address(this))
        );
    }

    function setManager(address _manager) external onlyOwner {
        managerWallet = _manager;
    }

    function contributeForUser(address _presale, uint256 _amount, address _contributor) external onlyManager {
        FairLaunch(payable(_presale)).buyWithTokenByManager(_amount, _contributor);
    }
}

contract FairLaunch is Ownable {
    enum ParticipationStatus {
        notContributed,
        participated,
        withdrawn,
        claimed
    }
    struct UserData {
        address _contributor;
        uint256 _amount;
        uint256 _allocation;
        ParticipationStatus _status;
    }

    event BuyWithETH(UserData userData, uint256 buyTime);
    event BuyWithToken(UserData userData, uint256 buyTime);

    modifier onlyWhitelist() {
        require(
            whitelistEnabled == false || whitelist[msg.sender] == true,
            "Only whitelist can perform this action"
        );
        _;
    }

    modifier onlyManager() {
        require(msg.sender == managerWallet, "Only manager can perform this action");
        _;
    }

    modifier duringSale() {
        require(block.timestamp > startTime, "sale not started yet");
        require(!(isFinalized == true || block.timestamp > endTime), "sale ended");
        _;
    }

    // 4.5% bnb raised

    address public factoryAddress;
    address public WETH = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c; // WBNB address
    address public UniswapFactoryAddress;
    address public pairAddress;
    uint256 public amountLiquidity;
    address public managerWallet = factoryAddress;

    bool public finalizeStatus; // true : finalize and add lp / false : cancel and refund

    mapping(address => UserData) public users;
    uint256 public totalUsers;

    address[2] acceptedTokenAddresses = [
        0xdAC17F958D2ee523a2206206994597C13D831ec7,
        0xDD1b6B259986571A85dA82A84f461e1c212591c0
    ]; // usdt, blazex

    IERC20 public tokenAddress;
    uint public acceptedTokens; // 0 : ETH 1 : USDT 2 : BlazeX
    uint256 public softcap;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public initialLiquidityPercentage = 51; // %
    uint256 public liquidityPercentage;
    uint256 public sellAmount;

    mapping(address => bool) whitelist;
    bool public whitelistEnabled = false; // disable whitelist check

    uint256 public minimumBuyAmount;
    uint256 public maximumBuyAmount;

    address public routerAddress; // uniswap or pancakeswap

    uint256 public lockupDates = 60; // at least 60 days

    uint256 public totalDepositAmount = 0;
    uint256 public totalContributor = 0;

    address public maxContributor;
    uint256 public maxContributionAmount;

    bool public isFinalized;

    uint256 penaltyWithdraw = 10; // 10%

    uint256 totalAmountRequired;

    uint256 referralPercentage;

    // address[] private referrers;
    mapping(uint256 => address) public referrers;
    mapping(address => uint256) public amountReferred;
    //    uint256[] public amountReferred;

    mapping(address => uint) public referrerID;

    uint256 public referrerCount = 0;

    constructor(address _factoryAddress) {
        factoryAddress = _factoryAddress;
    }

  // Function to receive Ether
    receive() external payable {
        buyWithETH(msg.sender);
    }

    function initialize1(
        uint256 _minimumBuyAmount,
        uint256 _maximumBuyAmount,
        uint256 _lockupPeriod,
        uint256 _liquidityPercentage,
        uint256 _referralPercentage,
        bool _isPancakeRouter,
        bool _whitelistEnabled
    ) public {
        require(
            msg.sender == factoryAddress,
            "Only factory can call this function"
        );
        require(
            _maximumBuyAmount == 0 || _minimumBuyAmount <= _maximumBuyAmount,
            "minimum buy amount must be smaller than maximum buy amount"
        );
        require(
            _lockupPeriod > 60,
            "lockup period must be bigger than 60 days"
        );
        require(
            _liquidityPercentage > initialLiquidityPercentage &&
                _liquidityPercentage <= 100,
            "liquidity percentage must be bigger than initial"
        );
        require(_referralPercentage <= 5, "referral must be smaller than 5");
        minimumBuyAmount = _minimumBuyAmount;
        maximumBuyAmount = _maximumBuyAmount;
        liquidityPercentage = _liquidityPercentage;
        whitelistEnabled = _whitelistEnabled;
        lockupDates = _lockupPeriod;
        referralPercentage = _referralPercentage;

        if (_isPancakeRouter == false) {
            // Uniswap
            routerAddress = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
            UniswapFactoryAddress = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
        } else {
            // PancakeSwap
            routerAddress = 0xD99D1c33F9fC3444f8101754aBC46c52416550D1;
            UniswapFactoryAddress = 0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73; // on Binance;
            // UniswapFactoryAddress = 0x1097053Fd2ea711dad45caCcc45EfF7548fCB362; // on Ethereum
        }
    }

    function initialize(
        IERC20 _tokenAddress,
        uint256 _sellAmount,
        uint _acceptedTokens,
        uint256 _softcap,
        uint256 _startTime,
        uint256 _endTime
    ) public {
        // 0 : uniswap 1 : pancakeswap
        require(
            msg.sender == factoryAddress,
            "Only factory can call this function"
        );
        require(_acceptedTokens < 3, "invalid accpeted token");
        require(_softcap > 0, "softcap must be bigger than 0");
        require(
            _startTime < _endTime,
            "end time should be greater than start time"
        );
        require(_startTime > block.timestamp, "should be later than now");

        tokenAddress = _tokenAddress;
        acceptedTokens = _acceptedTokens;
        softcap = _softcap;
        startTime = _startTime;
        endTime = _endTime;

        sellAmount = _sellAmount;

        totalAmountRequired = tokenAddress.balanceOf(address(this));
    }

    function whitelistInitialize(address[] memory _whitelist) public {
        require(
            msg.sender == factoryAddress,
            "only factory can call this function"
        );

        for (uint i = 0; i < _whitelist.length; i++)
            whitelist[_whitelist[i]] = true;
    }

    function buyWithETH(
        address _referralAddress
    ) public payable onlyWhitelist duringSale {
        require(acceptedTokens == 0, "can't buy with eth");
        require(
            users[msg.sender]._status == ParticipationStatus.notContributed ||
                users[msg.sender]._status == ParticipationStatus.participated,
            "Can't buy once you withdraw"
        );
        require(msg.value > 0, "no eth received");
        require(
            msg.value > minimumBuyAmount,
            "should buy more than minimum buy amount"
        );
        require(
            maximumBuyAmount == 0 || msg.value < maximumBuyAmount,
            "should buy less than maximum buy amount"
        );
        uint256 amountSent = msg.value;
        if (_referralAddress != address(0) && referralPercentage > 0) {
            uint256 rewardAmount = (amountSent * referralPercentage) / 100;
            payable(_referralAddress).transfer(rewardAmount);
            if (referrerID[_referralAddress] == 0) {
                referrerCount++;
                referrers[referrerCount] = _referralAddress;
                referrerID[_referralAddress] = referrerCount;
                amountReferred[_referralAddress] = amountSent;
            } else {
                amountReferred[_referralAddress] += amountSent;
            }
            amountSent -= rewardAmount;
        }
        users[msg.sender]._contributor = msg.sender;
        if(users[msg.sender]._amount == 0) {
            totalContributor++;
        }
        users[msg.sender]._amount += amountSent;
        users[msg.sender]._status = ParticipationStatus.participated;
        totalDepositAmount += amountSent;
        if(amountSent > users[maxContributor]._amount){
            maxContributor = msg.sender;
            maxContributionAmount = amountSent;
        }

        emit BuyWithETH(users[msg.sender], block.timestamp);
    }

    function buyWithToken(
        uint256 _tokenAmount,
        address _referralAddress
    ) external onlyWhitelist duringSale {
        //_tokenAmount is USDT or BlazeX token amount
        require(acceptedTokens > 0, "only eth is accepted");
        require(_tokenAmount > 0, "should send more than 0 tokens");
        require(
            _tokenAmount > minimumBuyAmount,
            "should buy more than minimum buy amount"
        );
        require(
            maximumBuyAmount == 0 || _tokenAmount < maximumBuyAmount,
            "should buy less than maximum buy amount"
        );
        require(
            users[msg.sender]._status == ParticipationStatus.notContributed ||
                users[msg.sender]._status == ParticipationStatus.participated,
            "Can't buy once you withdraw"
        );

        IERC20 buyToken = IERC20(acceptedTokenAddresses[acceptedTokens - 1]);
        buyToken.transferFrom(msg.sender, address(this), _tokenAmount);

        uint256 amountSent = _tokenAmount;
        if (_referralAddress != address(0) && referralPercentage > 0) {
            uint256 rewardAmount = (amountSent * referralPercentage) / 100;
            buyToken.transfer(_referralAddress, rewardAmount);
            if (referrerID[_referralAddress] == 0) {
                referrerCount++;
                referrers[referrerCount] = _referralAddress;
                referrerID[_referralAddress] = referrerCount;
                amountReferred[_referralAddress] = amountSent;
            } else {
                amountReferred[_referralAddress] += amountSent;
            }
            amountSent -= rewardAmount;
        }

        users[msg.sender]._contributor = msg.sender;
        users[msg.sender]._amount += amountSent;
        users[msg.sender]._status = ParticipationStatus.participated;

        totalDepositAmount += amountSent;
        if(amountSent > users[maxContributor]._amount){
            maxContributor = msg.sender;
            maxContributionAmount = amountSent;
        }

        emit BuyWithToken(users[msg.sender], block.timestamp);
    }

    function buyWithTokenByManager(
        uint256 _tokenAmount,
        address _contributor
    ) external onlyManager duringSale {
        //_tokenAmount is USDT or BlazeX token amount
        require(acceptedTokens > 0, "only eth is accepted");
        require(_tokenAmount > 0, "should send more than 0 tokens");
        require(
            _tokenAmount > minimumBuyAmount,
            "should buy more than minimum buy amount"
        );
        require(
            maximumBuyAmount == 0 || _tokenAmount < maximumBuyAmount,
            "should buy less than maximum buy amount"
        );
        require(
            users[_contributor]._status == ParticipationStatus.notContributed ||
                users[_contributor]._status == ParticipationStatus.participated,
            "Can't buy once you withdraw"
        );

        IERC20 buyToken = IERC20(acceptedTokenAddresses[acceptedTokens - 1]);
        buyToken.transferFrom(msg.sender, address(this), _tokenAmount);

        uint256 amountSent = _tokenAmount;

        users[_contributor]._contributor = _contributor;
        users[_contributor]._amount += amountSent;
        users[_contributor]._status = ParticipationStatus.participated;

        totalDepositAmount += amountSent;

        emit BuyWithToken(users[_contributor], block.timestamp);
    }

    function calcAllocation(
        uint256 _total,
        uint256 _depositAmount,
        uint256 _sellAmount
    ) public pure returns (uint256) {
        return (_sellAmount * _depositAmount) / _total;
    }

    function calcCurrentRate() public view returns (uint256) {
        uint256 _decimalsOfAcceptedToken = 18;
        uint256 _raisedAmount = address(this).balance;
        if (acceptedTokens != 0) {
            IERC20 _buyToken = IERC20(
                acceptedTokenAddresses[acceptedTokens - 1]
            );
            _decimalsOfAcceptedToken = _buyToken.decimals();
            _raisedAmount = _buyToken.balanceOf(address(this));
        }

        return (sellAmount * 10 ** _decimalsOfAcceptedToken) / _raisedAmount;
    }

    function claim() external onlyWhitelist {
        require(
            isFinalized == true && block.timestamp > endTime + 24 hours ||
                totalDepositAmount >= softcap,
            "You can withdraw after 24 hours of sale end"
        );
        require(
            users[msg.sender]._status == ParticipationStatus.participated &&
                (users[msg.sender]._amount > 0),
            "Unable to claim"
        );
        users[msg.sender]._status = ParticipationStatus.claimed;

        users[msg.sender]._allocation = calcAllocation(
            totalDepositAmount,
            users[msg.sender]._amount,
            sellAmount
        );

        tokenAddress.transfer(msg.sender, users[msg.sender]._allocation);
    }

    function withdraw() external onlyWhitelist {
        require(
            users[msg.sender]._status == ParticipationStatus.participated &&
                (users[msg.sender]._amount > 0),
            "Unable to withdraw"
        );
        require((block.timestamp>endTime && totalDepositAmount < softcap) || ( isFinalized == true && finalizeStatus == false), "Can withdraw only sale ended");

        users[msg.sender]._status = ParticipationStatus.withdrawn;
        if (acceptedTokens == 0) {
            payable(msg.sender).transfer(users[msg.sender]._amount);
        } else {
            IERC20 buyToken = IERC20(
                acceptedTokenAddresses[acceptedTokens - 1]
            );
            buyToken.transfer(msg.sender, users[msg.sender]._amount);
        }
    }

    function emergencyWithdraw() external onlyWhitelist {
        require(!isFinalized, "already finalized");
        require(
            block.timestamp > startTime &&
                block.timestamp + 15 minutes < endTime,
            "Can emergency withdraw only when sale under progress"
        );
        require(
            users[msg.sender]._status == ParticipationStatus.participated &&
                (users[msg.sender]._amount > 0),
            "Unable to withdraw"
        );

        users[msg.sender]._status = ParticipationStatus.withdrawn;

        uint256 _amountPenalty = (users[msg.sender]._amount * penaltyWithdraw) /
            100;
        uint256 _amountWithdraw = users[msg.sender]._amount - _amountPenalty;

        totalDepositAmount -= users[msg.sender]._amount;

        if (acceptedTokens == 0) {
            payable(msg.sender).transfer(_amountWithdraw);
            payable(factoryAddress).transfer(_amountPenalty);
        } else {
            IERC20 buyToken = IERC20(
                acceptedTokenAddresses[acceptedTokens - 1]
            );
            buyToken.transfer(msg.sender, _amountWithdraw);
            buyToken.transfer(factoryAddress, _amountPenalty);
        }
    }

    function increaseEndTime(uint256 _timeInSeconds) external onlyOwner {
        require(block.timestamp < endTime, "Sale already ended");
        endTime += _timeInSeconds;
    }

    function adjustCaps(uint256 _newSoftCap) external onlyOwner {
        require(block.timestamp < endTime, "Sale already ended");
        require(_newSoftCap > 0, "softcap must be bigger than 0");
        softcap = _newSoftCap;
    }

    function enableWhitelist() external onlyOwner {
        whitelistEnabled = true;
    }

    function disableWhitelist() external onlyOwner {
        whitelistEnabled = false;
    }

    // priceOfToken : $ price per 1 Ether (1 BNB or 1 USDT or 1 BlazeX) eg:priceOfToken = 10 ** 18 then 1 BlazeX is 1$;
    // totalSupply / sellAmount * BNBraised * BNB price
    // return value 10**18 * marketCapinUSD
    function calcInitialMarketCapInToken(
        uint256 priceOfToken
    ) public view returns (uint256) {
        uint256 _raisedAmount = address(this).balance;
        uint256 _decimalsOfAcceptedToken = 18;
        if (acceptedTokens != 0) {
            IERC20 _buyToken = IERC20(
                acceptedTokenAddresses[acceptedTokens - 1]
            );
            _raisedAmount = _buyToken.balanceOf(address(this));
            _decimalsOfAcceptedToken = _buyToken.decimals();
        }
        return
            (tokenAddress.totalSupply() * _raisedAmount * priceOfToken) /
            sellAmount /
            10 ** _decimalsOfAcceptedToken;
    }

    function totalTokensSold() public view returns (uint256) {
        return totalDepositAmount;
    }

    function finalize() external onlyOwner {
        require(!isFinalized, "already finalized");
        require(totalDepositAmount > softcap, "not hitted softcap");

        isFinalized = true;

        endTime = block.timestamp;
        finalizeStatus = true;

        IUniswapV2Router02 router = IUniswapV2Router02(routerAddress);

        //      take fee of 4.5%
        if (acceptedTokens == 0) {
            uint256 totalAmount = address(this).balance;
            uint256 feeAmount = (totalAmount * 45) / 1000;
            payable(factoryAddress).transfer(feeAmount);

            // remainingBNB * liquidity percentage / 1000 -> liquidity BNB
            uint256 liquidityBNBAmount = ((totalAmount - feeAmount) *
                liquidityPercentage) / 1000;
            uint256 liquidityTokenAmount = totalAmountRequired - sellAmount;

            tokenAddress.approve(routerAddress, liquidityTokenAmount);

            (, , amountLiquidity) = router.addLiquidityETH{
                value: liquidityBNBAmount
            }(
                address(tokenAddress),
                liquidityTokenAmount,
                0,
                liquidityBNBAmount,
                address(this),
                block.timestamp + 2 minutes
            );

            pairAddress = UniswapV2Library.pairFor(
                UniswapFactoryAddress,
                address(tokenAddress),
                WETH
            );

            payable(msg.sender).transfer(address(this).balance);
        } else {
            IERC20 payToken = IERC20(
                acceptedTokenAddresses[acceptedTokens - 1]
            );

            uint256 totalAmount = payToken.balanceOf(address(this));
            uint256 feeAmount = (totalAmount * 45) / 1000;

            payToken.transfer(factoryAddress, feeAmount);

            // remainingBNB * liquidity percentage / 1000 -> liquidity BNB
            uint256 liquidityTargetAmount = ((totalAmount - feeAmount) *
                liquidityPercentage) / 1000;

            tokenAddress.approve(
                routerAddress,
                totalAmountRequired - sellAmount
            );
            payToken.approve(routerAddress, liquidityTargetAmount);

            (, , amountLiquidity) = router.addLiquidity(
                address(tokenAddress),
                address(payToken),
                totalAmountRequired - sellAmount,
                liquidityTargetAmount,
                0,
                0,
                address(this),
                block.timestamp + 2 minutes
            );

            pairAddress = UniswapV2Library.pairFor(
                UniswapFactoryAddress,
                address(tokenAddress),
                address(payToken)
            );

            payToken.transfer(msg.sender, payToken.balanceOf(address(this)));
        }
    }

    function cancelAndRefund() external onlyOwner {
        require(isFinalized == false, "Pool already finalized");
        isFinalized = true;
        endTime = block.timestamp;
        finalizeStatus = false;
    }

    function withdrawLiquidity() external onlyOwner {
        require(
            isFinalized == true && finalizeStatus == true &&
            block.timestamp > endTime + lockupDates * 1 days,
            "Can't withdraw until lockup period"
        );
        IERC20(pairAddress).transfer(msg.sender, amountLiquidity);
    }
}