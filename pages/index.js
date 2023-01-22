import Head from 'next/head'
import { Inter } from '@next/font/google'
import { useEffect, useState } from "react"
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
  faTowerObservation, faA, faO, faPercent, faDollarSign
} from "@fortawesome/free-solid-svg-icons";


const inter = Inter({ subsets: ['latin'] })

export default function Home() {

  useEffect(() => {
    document.body.classList.add("bg-black-alt");
    document.body.classList.add("font-sans");
    document.body.classList.add("leading-normal");
    document.body.classList.add("tracking-normal");
  });

  const setup = {
    adaInitialPrice: 0.34,
    djedInitialSupply: 1000000,
    adaReserveInitialAmount: 4000000
  }

  const djedMintFeePct = 0.0015
  const djedBurnFeePct = 0.0015

  const shenMintFeePct = 0.0002
  const shenBurnFeePct = 0.0005

  const opFeePct = 0.0005

  const [djedAmount, setDjedAmount] = useState(0)
  const [shenAmount, setShenAmount] = useState(0)
  const [adaUsdRate, setAdaUsdRate] = useState(0.5) // 1 ada is worth X usd
  const [adaReserveAmt, setAdaReserveAmt] = useState(0)

  const [shenPrice, setShenPrice] = useState(1.0)

  const [collateralPct, setCollateralPct] = useState(0.0)

  const [opFeeTotal, setOpFeeTotal] = useState(0.0)

  const [feeTotal, setFeeTotal] = useState(0.0)

  const [djedAmountToMint, setDjedAmountToMint] = useState(100)
  const [djedAmountToBurn, setDjedAmountToBurn] = useState(100)
  const [shenAmountToMint, setShenAmountToMint] = useState(100)
  const [shenAmountToBurn, setShenAmountToBurn] = useState(100)

  const [collColor, setCollColor] = useState('bg-white')
  const [collStatus, setCollStatus] = useState('N/A')

  const [showModal, setShowModal] = useState(false)

  function calcCollPct(currentDjedSupply, currentAdaUsdRate, currentAdaReserveAmount) {

    const djedSupplyInAda = currentDjedSupply / currentAdaUsdRate
    console.log('djedSupplyInAda: ' + djedSupplyInAda)

    if (djedSupplyInAda == 0) {
      return 0.0
    } else {
      const rate = (currentAdaReserveAmount + djedSupplyInAda) / djedSupplyInAda
      return parseFloat(rate).toFixed(2) * 100
    }

  }

  function shenPriceInAda(currentShenAmount, currentAdaReserveAmount, currentDjedSupply, currentAdaUsdRate) {
    console.log('currentShenAmount: ' + currentShenAmount)

    const djedSupplyInAda = currentDjedSupply / currentAdaUsdRate
    console.log('djedSupplyInAda: ' + djedSupplyInAda)

    if (currentShenAmount > 0) {
      const priceInAda = Math.max(((currentAdaReserveAmount - djedSupplyInAda) / currentShenAmount), 0.001)
      return parseFloat(priceInAda).toFixed(6)
    } else {
      return 1.0
    }
  }

  async function shenPriceInUsd() {
    return shenPriceInAda * adaUsdRate
  }

  async function mintShen(shenAmountToMint) {

    const totalShenAmount = shenAmount + shenAmountToMint

    const currentShenPriceInAda = shenPriceInAda(shenAmount, adaReserveAmt, djedAmount, adaUsdRate)
    console.log('currentShenPriceInAda: ' + currentShenPriceInAda)

    const adaToBeAddedInReserve = currentShenPriceInAda * shenAmountToMint
    console.log('adaToBeAddedInReserve: ' + adaToBeAddedInReserve)

    const fee = shenMintFeePct * adaToBeAddedInReserve
    console.log('fee: ' + fee)

    const newAdaReserveAmt = adaReserveAmt + fee + adaToBeAddedInReserve
    console.log('newAdaReserveAmt: ' + newAdaReserveAmt)

    const coll = calcCollPct(djedAmount, adaUsdRate, newAdaReserveAmt)
    console.log('coll: ' + coll)

    if (coll != 0 && coll > 800) {
      toast.error('Too much collateralization. Try to mint less $SHEN or buy some $DJED first')
      return
    }

    const newShenPriceInAda = shenPriceInAda(totalShenAmount, newAdaReserveAmt, djedAmount, adaUsdRate)
    console.log('newShenPriceInAda: ' + newShenPriceInAda)
    setShenPrice(newShenPriceInAda)

    setShenAmount(totalShenAmount)
    setAdaReserveAmt(newAdaReserveAmt)
    setFeeTotal(feeTotal + fee)


    setCollateralColor(coll)
    setCollateralPct(coll)
  }

  function setCollateralColor(coll) {
    if (coll == 0) {
      setCollColor('bg-white')
      setCollStatus('N/A')
    } else if (coll < 400) {
      setCollColor('bg-red-600')
      setCollStatus('Very Low')
    } else if (coll < 500) {
      setCollColor('bg-orange-300')
      setCollStatus('Low')
    } else if (coll < 700) {
      setCollColor('bg-green-300')
      setCollStatus('Ideal')
    } else if (coll < 800) {
      setCollColor('bg-blue-600')
      setCollStatus('High')
    } else {
      setCollColor('bg-purple-600')
      setCollStatus('Very High')
    }
  }

  async function burnShen(shenAmountToBurn) {

    if (shenAmountToBurn > shenAmount) {
      toast.error('Trying to burn more shen than the circulating supply')
      return
    }

    const totalShenAmount = shenAmount - shenAmountToBurn

    const currentShenPriceInAda = shenPriceInAda(shenAmount, adaReserveAmt, djedAmount, adaUsdRate)
    console.log('currentShenPriceInAda: ' + currentShenPriceInAda)

    const adaToBeRemovedFromReserve = currentShenPriceInAda * shenAmountToBurn
    console.log('adaToBeRemovedFromReserve: ' + adaToBeRemovedFromReserve)

    const fee = shenBurnFeePct * adaToBeRemovedFromReserve
    console.log('fee: ' + fee)

    const newAdaReserveAmt = adaReserveAmt + fee - adaToBeRemovedFromReserve
    console.log('newAdaReserveAmt: ' + newAdaReserveAmt)

    const coll = calcCollPct(djedAmount, adaUsdRate, newAdaReserveAmt)
    console.log('coll: ' + coll)

    if (coll != 0 && coll < 400) {
      toast.error('Not enough collateral. Try to burn less $SHEN')
      return
    }

    setShenAmount(totalShenAmount)
    setAdaReserveAmt(newAdaReserveAmt)
    setFeeTotal(feeTotal + fee)

    const newShenPriceInAda = shenPriceInAda(totalShenAmount, newAdaReserveAmt, djedAmount, adaUsdRate)
    console.log('newShenPriceInAda: ' + newShenPriceInAda)
    setShenPrice(newShenPriceInAda)

    setCollateralColor(coll)
    setCollateralPct(coll)
  }

  async function mintOneShen() {
    return mintShen(1)
  }

  async function mintDjed(djedAmountToMint) {

    const totalDjedAmount = djedAmount + djedAmountToMint
    console.log('totalDjedAmount: ' + totalDjedAmount)

    const adaToBeAddedInReserve = djedAmountToMint / adaUsdRate
    console.log('adaToBeAddedInReserve: ' + adaToBeAddedInReserve)

    const opFee = opFeePct * adaToBeAddedInReserve
    console.log('opFee: ' + opFee)

    const fee = djedMintFeePct * adaToBeAddedInReserve
    console.log('fee: ' + fee)

    const newAdaReserveAmt = adaReserveAmt + fee + adaToBeAddedInReserve
    console.log('newAdaReserveAmt: ' + newAdaReserveAmt)

    const coll = calcCollPct(totalDjedAmount, adaUsdRate, newAdaReserveAmt)
    console.log('coll: ' + coll)

    if (coll == 0 || coll < 400) {
      toast.error('Not enough collateral. Try to mint less $DJED or buy some $SHEN first')
      return
    }

    setDjedAmount(totalDjedAmount)

    setAdaReserveAmt(newAdaReserveAmt)
    setOpFeeTotal(opFeeTotal + opFee)
    setFeeTotal(feeTotal + fee)

    const newShenPriceInAda = shenPriceInAda(shenAmount, newAdaReserveAmt, totalDjedAmount, adaUsdRate)
    console.log('newShenPriceInAda: ' + newShenPriceInAda)
    setShenPrice(newShenPriceInAda)

    setCollateralColor(coll)
    setCollateralPct(coll)
  }

  async function burnDjed(djedAmountToBurn) {

    if (djedAmountToBurn > djedAmount) {
      toast.error('Trying to burn more djed than the circulating supply')
      return
    }

    const totalDjedAmount = djedAmount - djedAmountToBurn
    console.log('totalDjedAmount: ' + totalDjedAmount)

    const adaToBeRemoedFromReserve = djedAmountToBurn / adaUsdRate
    console.log('adaToBeRemoedFromReserve: ' + adaToBeRemoedFromReserve)

    const opFee = opFeePct * adaToBeRemoedFromReserve
    console.log('opFee: ' + opFee)

    const fee = djedBurnFeePct * adaToBeRemoedFromReserve
    console.log('fee: ' + fee)

    const newAdaReserveAmt = adaReserveAmt + fee - adaToBeRemoedFromReserve
    console.log('newAdaReserveAmt: ' + newAdaReserveAmt)

    const coll = calcCollPct(totalDjedAmount, adaUsdRate, newAdaReserveAmt)
    console.log('coll: ' + coll)

    setDjedAmount(totalDjedAmount)

    setAdaReserveAmt(newAdaReserveAmt)
    setOpFeeTotal(opFeeTotal + opFee)
    setFeeTotal(feeTotal + fee)

    const newShenPriceInAda = shenPriceInAda(shenAmount, newAdaReserveAmt, totalDjedAmount, adaUsdRate)
    console.log('newShenPriceInAda: ' + newShenPriceInAda)
    setShenPrice(newShenPriceInAda)

    setCollateralColor(coll)
    setCollateralPct(coll)
  }

  async function mintOneDjed() {
    return mintDjed(1)
  }

  async function increaseAdaPrice() {

    const newAdaPrice = adaUsdRate + 0.01

    setAdaUsdRate(newAdaPrice)

    const newShenPriceInAda = shenPriceInAda(shenAmount, adaReserveAmt, djedAmount, newAdaPrice)
    console.log('newShenPriceInAda: ' + newShenPriceInAda)
    setShenPrice(newShenPriceInAda)

    const coll = calcCollPct(djedAmount, adaUsdRate, adaReserveAmt)
    console.log('coll: ' + coll)
    setCollateralColor(coll)
    setCollateralPct(coll)

  }

  async function decreaseAdaPrice() {

    const newAdaPrice = adaUsdRate - 0.01

    setAdaUsdRate(newAdaPrice)

    const newShenPriceInAda = shenPriceInAda(shenAmount, adaReserveAmt, djedAmount, newAdaPrice)
    console.log('newShenPriceInAda: ' + newShenPriceInAda)
    setShenPrice(newShenPriceInAda)

    const coll = calcCollPct(djedAmount, adaUsdRate, adaReserveAmt)
    console.log('coll: ' + coll)
    setCollateralColor(coll)
    setCollateralPct(coll)

  }

  return (
    <>
      <Toaster />
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav id="header" className="bg-gray-900 fixed w-full z-10 top-0 shadow">

        <div className="w-full container mx-auto flex flex-wrap items-center mt-0 pt-3 pb-3 md:pb-0">
          <div className="w-1/2 pl-2 md:pl-0">
            <a className="text-gray-100 text-base xl:text-xl no-underline hover:no-underline font-bold" href="#">
              <i className="fas fa-moon text-blue-400 pr-3"></i> Play with DJED
            </a>
          </div>

          <div className="relative pl-4 pr-4 space-x-2 dropdown pull-right md:pr-0">
            <div className="relative inline-block">
              <div>
                <button
                  className='px-3 py-2 rounded-full dropdown-toggle bg-slate-300 hover:bg-slate-400'
                  type="button"
                  id="menu-button"
                  aria-expanded="true"
                  aria-haspopup="true"
                  onClick={() => setShowModal(!showModal)}
                >Help</button>
              </div>
            </div>


          </div>
        </div>



        {showModal ? (
          <>
            <div className="fixed inset-0 z-50 block items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
              <div className="relative w-auto max-w-3xl mx-auto my-6">
                <div className="relative flex flex-col w-full bg-gray-400 border-0 rounded-lg shadow-lg outline-none focus:outline-none">
                  <div className="flex items-start justify-between p-5 border-b border-gray-300 border-solid rounded-t ">
                    <h3 className="text-3xl font=semibold capitalize">Help</h3>
                    <button
                      className="float-right text-black bg-transparent border-0"
                      onClick={() => setShowModal(false)}
                    >
                      <span className="block w-6 h-6 py-0 text-xl text-black bg-gray-400 rounded-full opacity-7">
                        x
                      </span>
                    </button>
                  </div>
                  <div className="relative flex-auto p-6">
                    <div className="border border-gray-800 rounded shadow">
                      <div className="p-5 text-black">
                        <div className='m-2'>
                          <h2 className='font-medium text-xl'>What is Djed</h2>
                          <p>Cardano&apos;s native overcollateralized stablecoin, developed by IOG and powered by COTI. $DJED is backed by $ADA and uses $SHEN as a reserve coin.</p>
                          <p>
                            To ensure Djed&apos;s stability, it uses a collateral ratio between 400% and 800% for $DJED and $SHEN.
                          </p>
                          <p>
                            Find out more on <Link href="https://djed.xyz" className='text-blue-600 hover:text-blue-700 transition duration-300 ease-in-out mb-4'>djed.xyz</Link>
                          </p>
                        </div>
                        <div className='m-2'>
                          <h2 className='font-medium text-xl'>Initial setup</h2>
                          <p>
                            To allow you to setup whichever test case, when there are no $djed minted, you can mint/burn as much $shen you want, so you can create a
                            simulation in the thousands or million of dollars. I would recommend to play with both small and large amounts.
                          </p>
                        </div>
                        <div className='m-2'>
                          <h2 className='font-medium text-xl'>Djed and Shen rules</h2>
                          <ul className='list-disc'>
                            <li>You can always burn $djed and withdraw ada back</li>
                            <li>Minting djed and burning/minting shen, is subject to a healthy collateralization</li>
                            <li>$ada price in usd affects collateralization, test it by adjusting $ada price</li>
                            <li>If you get a warning, try to mint/burn a smaller amount of $djed/$shen</li>
                            <li>Request fees: transaction fees that go into the reserve. It increases both the reserve (collateralization) and the value of $shen </li>
                            <li>Operational fees: fees that are paid to COTI </li>
                          </ul>
                        </div>
                        <div className='m-2'>
                          <h2 className='font-medium text-xl'>Shen holder advantages/perkes</h2>
                          <ul className='list-disc'>
                            <li>Ada in the reserve are staked on stakepool, rewards will go into the reserve and increase both reserve and $shen value </li>
                            <li>$ada price in usd affects $shen value directly. Look how good it is when ada price goes up #NFA</li>
                            <li>There will be $shen Liquidity Pool on the major DEXes. Possibly farms and further incentives</li>
                            <li>As you can experiment yourself, $shen appreciates if $ada appreciates. Investing for the long term could give nice earnings. #NFA.</li>
                          </ul>
                        </div>

                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </>
        ) : null}


      </nav>

      <div className="container w-full mx-auto pt-20 flex flex-wrap">
        <div className="w-full md:w-1/2 xl:w-1/3 p-3">

          <div className="bg-gray-900 border border-gray-800 rounded shadow">
            <div className="border-b border-gray-800 p-3">
              <h5 className="font-bold uppercase text-gray-600">Disclaimer</h5>
            </div>
            <div className="p-5 text-gray-400">
              <p>This is an unofficial, educational website to experiment with Cardano/COTI Djed Stablecoin</p>
              <p>
                This does not represent Financial advice. Use at your own risk.
              </p>
            </div>
          </div>

        </div>
        <div className="w-full md:w-1/2 xl:w-1/3 p-3">

          <div className="bg-gray-900 border border-gray-800 rounded shadow">
            <div className="border-b border-gray-800 p-3">
              <h5 className="font-bold uppercase text-gray-600">Kudos</h5>
            </div>
            <div className="p-5 text-gray-400">
              <p>This Djed Simulator was developed by <Link href='https://twitter.com/CryptoJoe101' className='text-blue-600 hover:text-blue-700 transition duration-300 ease-in-out mb-4'>Giovanni</Link> SPO of
                <Link href="https://pool.pm/20df8645abddf09403ba2656cda7da2cd163973a5e439c6e43dcbea9" className='text-blue-600 hover:text-blue-700 transition duration-300 ease-in-out mb-4'> EASY1 Stakepool</Link></p>
              <p>
                Delegate to EASY1 Stakepool and earn extra tokens such as <span className='text-blue-600 hover:text-blue-700 transition duration-300 ease-in-out mb-4'>$NTX</span> and <span className='text-blue-600 hover:text-blue-700 transition duration-300 ease-in-out mb-4'>$WMT</span> via Tosidrop.
              </p>
            </div>
          </div>

        </div>
        <div className="w-full md:w-1/2 xl:w-1/3 p-3">

          <div className="bg-gray-900 border border-gray-800 rounded shadow">
            <div className="border-b border-gray-800 p-3">
              <h5 className="font-bold uppercase text-gray-600">TIP</h5>
            </div>
            <div className="p-5 text-gray-400">
              <p> Do you like the Djed/Shen simulator? Tip at <span className='text-blue-600 hover:text-blue-700 transition duration-300 ease-in-out mb-4'>$CryptoJoe101</span>.</p>
              <p>Thanks!</p>
            </div>
          </div>

        </div>

      </div>

      <div className="container w-full mx-auto pt-5">

        <div className="w-full px-4 md:px-0 md:mt-1 mb-1 text-gray-800 leading-normal">


          <div className="flex flex-wrap">
            <div className="w-full md:w-1/2 xl:w-1/3 p-3">

              <div className="bg-gray-900 border border-gray-800 rounded shadow p-2">
                <div className="flex flex-row items-center">
                  <div className="flex-shrink pr-4">
                    <div className="rounded p-3 bg-green-600">
                      <FontAwesomeIcon
                        icon={faTowerObservation}
                        className="text-3xl"
                      />
                    </div>
                  </div>
                  <div className="flex-1 text-right md:text-center">
                    <h5 className="font-bold uppercase text-gray-400">Dejd Supply</h5>
                    <h3 className="font-bold text-3xl text-gray-600"> {djedAmount} </h3>
                  </div>
                </div>
              </div>

            </div>
            <div className="w-full md:w-1/2 xl:w-1/3 p-3">

              <div className="bg-gray-900 border border-gray-800 rounded shadow p-2">
                <div className="flex flex-row items-center">
                  <div className="flex-shrink pr-4">
                    <div className="rounded p-3 bg-pink-600">
                      <FontAwesomeIcon
                        icon={faA}
                        className="text-3xl"
                      />
                    </div>
                  </div>
                  <div className="flex-1 text-right md:text-center">
                    <h5 className="font-bold uppercase text-gray-400">Djed Supply in Ada</h5>
                    <h3 className="font-bold text-3xl text-gray-600"> {djedAmount / adaUsdRate} </h3>
                  </div>
                </div>
              </div>

            </div>
            <div className="w-full md:w-1/2 xl:w-1/3 p-3">

            </div>
            <div className="w-full md:w-1/2 xl:w-1/3 p-3">
              <div className="bg-gray-900 border border-gray-800 rounded shadow p-2">
                <div className="flex flex-row items-center">
                  <div className="flex-shrink pr-4">
                    <div className="rounded p-3 bg-blue-600">
                      <FontAwesomeIcon
                        icon={faO}
                        className="text-3xl"
                      />
                    </div>
                  </div>
                  <div className="flex-1 text-right md:text-center">
                    <h5 className="font-bold uppercase text-gray-400">Shen Supply</h5>
                    <h3 className="font-bold text-3xl text-gray-600"> {shenAmount} </h3>
                  </div>
                </div>
              </div>

            </div>
            <div className="w-full md:w-1/2 xl:w-1/3 p-3">

              <div className="bg-gray-900 border border-gray-800 rounded shadow p-2">
                <div className="flex flex-row items-center">
                  <div className="flex-shrink pr-4">
                    <div className="rounded p-3 bg-pink-600">
                      <FontAwesomeIcon
                        icon={faA}
                        className="text-3xl"
                      />
                    </div>
                  </div>
                  <div className="flex-1 text-right md:text-center">
                    <h5 className="font-bold uppercase text-gray-400">Shen Supply in Ada</h5>
                    <h3 className="font-bold text-3xl text-gray-600"> {parseFloat(shenAmount * shenPrice).toFixed(4)} </h3>
                  </div>
                </div>
              </div>

            </div>
            <div className="w-full md:w-1/2 xl:w-1/3 p-3">

              <div className="bg-gray-900 border border-gray-800 rounded shadow p-2">
                <div className="flex flex-row items-center">
                  <div className="flex-shrink pr-4">
                    <div className="rounded p-3 bg-pink-600">
                      <FontAwesomeIcon
                        icon={faA}
                        className="text-3xl"
                      />
                    </div>
                  </div>
                  <div className="flex-1 text-right md:text-center">
                    <h5 className="font-bold uppercase text-gray-400">Shen Price in Ada (estimated)</h5>
                    <h3 className="font-bold text-3xl text-gray-600"> {shenPrice} </h3>
                  </div>
                </div>
              </div>

            </div>
          </div>


          <hr className="border-b-2 border-gray-600 my-8 mx-4">
          </hr>

          <div className="flex flex-wrap">
            <div className="w-full md:w-1/2 xl:w-1/3 p-3">

              <div className="bg-gray-900 border border-gray-800 rounded shadow p-2">
                <div className="flex flex-row items-center">
                  <div className="flex-shrink pr-4">
                    <div className="rounded p-3 bg-green-600">
                      <FontAwesomeIcon
                        icon={faA}
                        className="text-3xl"
                      />
                    </div>
                  </div>
                  <div className="flex-1 text-right md:text-center">
                    <h5 className="font-bold uppercase text-gray-400">Ada Reserve</h5>
                    <h3 className="font-bold text-3xl text-gray-600"> {parseFloat(adaReserveAmt).toFixed(4)} </h3>
                  </div>
                </div>
              </div>

            </div>
            <div className="w-full md:w-1/2 xl:w-1/3 p-3">

              <div className="bg-gray-900 border border-gray-800 rounded shadow p-2">
                <div className="flex flex-row items-center">
                  <div className="flex-shrink pr-4">
                    <div className="rounded p-3 bg-pink-600">
                      <FontAwesomeIcon
                        icon={faA}
                        className="text-3xl"
                      />
                    </div>
                  </div>
                  <div className="flex-1 text-right md:text-center">
                    <h5 className="font-bold uppercase text-gray-400">Shen Supply in ADA (Equity)</h5>
                    <h3 className="font-bold text-3xl text-gray-600"> {parseFloat(adaReserveAmt - djedAmount / adaUsdRate).toFixed(4)}</h3>
                  </div>
                </div>
              </div>

            </div>

            <div className="w-full md:w-1/2 xl:w-1/3 p-3">

              <div className="bg-gray-900 border border-gray-800 rounded shadow p-2">
                <div className="flex flex-row items-center">
                  <div className="flex-shrink pr-4">
                    <div className={`rounded p-3 ` + collColor}>
                      <FontAwesomeIcon
                        icon={faPercent}
                        className="text-3xl"
                      />
                    </div>
                  </div>
                  <div className="flex-1 text-right md:text-center">
                    <h5 className="font-bold uppercase text-gray-400">Collateral </h5>
                    <h3 className="font-bold text-3xl text-gray-600"> {collateralPct} % ({collStatus})</h3>
                  </div>
                </div>
              </div>
            </div>


            <div className="w-full md:w-1/2 xl:w-1/3 p-3">
              <div className="bg-gray-900 border border-gray-800 rounded shadow p-2">
                <div className="flex flex-row items-center">
                  <div className="flex-shrink pr-4">
                    <div className="rounded p-3 bg-blue-600">
                      <FontAwesomeIcon
                        icon={faDollarSign}
                        className="text-3xl"
                      />
                    </div>
                  </div>
                  <div className="flex-1 text-right md:text-center">
                    <h5 className="font-bold uppercase text-gray-400">Ada Price</h5>
                    <h3 className="font-bold text-3xl text-gray-600"> {adaUsdRate} </h3>
                  </div>
                </div>
              </div>

            </div>

            <div className="w-full md:w-1/2 xl:w-1/3 p-3">

              <div className="bg-gray-900 border border-gray-800 rounded shadow p-2">
                <div className="flex flex-row items-center">
                  <div className="flex-shrink pr-4">
                    <div className="rounded p-3 bg-pink-600">
                      <FontAwesomeIcon
                        icon={faA}
                        className="text-3xl"
                      />
                    </div>
                  </div>
                  <div className="flex-1 text-right md:text-center">
                    <h5 className="font-bold uppercase text-gray-400"> Request Fees (Back into Reserve) </h5>
                    <h3 className="font-bold text-3xl text-gray-600"> {parseFloat(feeTotal).toFixed(6)}</h3>
                  </div>
                </div>
              </div>

            </div>
            <div className="w-full md:w-1/2 xl:w-1/3 p-3">

              <div className="bg-gray-900 border border-gray-800 rounded shadow p-2">
                <div className="flex flex-row items-center">
                  <div className="flex-shrink pr-4">
                    <div className="rounded p-3 bg-pink-600">
                      <FontAwesomeIcon
                        icon={faA}
                        className="text-3xl"
                      />
                    </div>
                  </div>
                  <div className="flex-1 text-right md:text-center">
                    <h5 className="font-bold uppercase text-gray-400">Operational Fee (COTI treasury) </h5>
                    <h3 className="font-bold text-3xl text-gray-600"> {parseFloat(opFeeTotal).toFixed(6)} </h3>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>


      <div className="container w-full mx-auto pt-20">

        <div className="w-full px-4 md:px-0 md:mt-1 mb-1 text-gray-800 leading-normal">


          <div className="flex flex-wrap">
            <div className="w-full md:w-1/2 xl:w-1/3 p-3 text-center">

              <div >
                <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' type="button" onClick={() => { mintDjed(djedAmountToMint) }} >
                  Mint Djed
                </button>
                <input type="text" className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-100 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500' value={djedAmountToMint} onChange={(event) => setDjedAmountToMint(parseFloat(event.target.value))}></input>
              </div>
              <div >
                <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' type="button" onClick={() => { burnDjed(djedAmountToBurn) }} >
                  Burn Djed
                </button>
                <input type="text" className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-100 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500' value={djedAmountToBurn} onChange={(event) => setDjedAmountToBurn(parseFloat(event.target.value))}></input>
              </div>

            </div>
            <div className="w-full md:w-1/2 xl:w-1/3 p-3 text-center">
              <div>
                <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' type="button" onClick={() => { mintShen(shenAmountToMint) }} >
                  Mint Shen
                </button>
                <input type="text" className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-100 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500' value={shenAmountToMint} onChange={(event) => setShenAmountToMint(parseFloat(event.target.value))}></input>
              </div>
              <div>
                <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' type="button" onClick={() => { burnShen(shenAmountToBurn) }} >
                  Burn Shen
                </button>
                <input type="text" className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-100 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500' value={shenAmountToBurn} onChange={(event) => setShenAmountToBurn(parseFloat(event.target.value))}></input>
              </div>
            </div>
            <div className="w-full md:w-1/2 xl:w-1/3 p-3">
              <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' type="button" onClick={() => { increaseAdaPrice() }} >
                Increase ADA Price (+0.01 usd)
              </button>
              <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' type="button" onClick={() => { decreaseAdaPrice() }} >
                Decrease ADA Price (-0.01 usd)
              </button>

            </div>

          </div>
        </div>
      </div>


      <div hidden>
        <h1 className="text-3xl font-bold underline">Play with Djed</h1>
        <h2>Unofficial, educational website to experiment with Cardano/COTI Djed Stablecoin</h2>
        <h3>
          SPONSOR: <a href='https://pool.pm/20df8645abddf09403ba2656cda7da2cd163973a5e439c6e43dcbea9'><u>EASY1 Stakepool</u></a>. Delegate and earn extra rewards: <strong>$NTX</strong> and <strong>$WMT</strong>. Info: <a href='https://www.reddit.com/r/CardanoStakePools/comments/10d9n3e/earn_ntx_and_wmt_by_staking_with_the_easy1/'><u>here</u></a></h3>
        <p>
          Djed Supply: {djedAmount} - Djed Supply in ADA: {djedAmount / adaUsdRate}
        </p>
        <p>
          Shen Supply: {shenAmount} - Shen Supply in ADA: {parseFloat(shenAmount * shenPrice).toFixed(4)} - Shen Price in Ada (estimated): {shenPrice}
        </p>
        <p>
          Ada Pool: {adaReserveAmt} / Ada Reserve: {adaReserveAmt - djedAmount / adaUsdRate} / Collateral (%): {collateralPct}
        </p>
        <p>
          Ada price: $ {adaUsdRate}
        </p>
        <p>
          Request Fees {parseFloat(feeTotal).toFixed(6)} / Operational Fee {parseFloat(opFeeTotal).toFixed(6)}
        </p>
        <div>
          <span>
            <button type="button" onClick={() => { mintDjed(djedAmountToMint) }} >
              Mint Djed
            </button>
            <input type="text" value={djedAmountToMint} onChange={(event) => setDjedAmountToMint(parseFloat(event.target.value))}></input>
          </span>
          <span>
            <button type="button" onClick={() => { mintShen(shenAmountToMint) }} >
              Mint Shen
            </button>
            <input type="text" value={shenAmountToMint} onChange={(event) => setShenAmountToMint(parseFloat(event.target.value))}></input>
          </span>
        </div>
        <div>
          <span>
            <button type="button" onClick={() => { burnDjed(djedAmountToBurn) }} >
              Burn Djed
            </button>
            <input type="text" value={djedAmountToBurn} onChange={(event) => setDjedAmountToBurn(parseFloat(event.target.value))}></input>
          </span>
          <span>
            <button type="button" onClick={() => { burnShen(shenAmountToBurn) }} >
              Burn Shen
            </button>
            <input type="text" value={shenAmountToBurn} onChange={(event) => setShenAmountToBurn(parseFloat(event.target.value))}></input>
          </span>
        </div>
        <div>
          <p>
            <button type="button" onClick={() => { increaseAdaPrice() }} >
              Increase ADA Price (+0.01 usd)
            </button>
          </p>
          <p>
            <button type="button" onClick={() => { decreaseAdaPrice() }} >
              Decrease ADA Price (-0.01 usd)
            </button>
          </p>
        </div>
        <h3>
          Do you like what you see? Consider supporting me delegating to the EASY1 Stake Pool
        </h3>
        <div>
          <h3>Some notes</h3>
          <ul>
            <li>
              To allow you to setup whichever test case, when there are no $djed minted, you can mint/burn how many $shen you want, so you can create a
              simulation in the thousands or million of dollars. I would recommend to play with both small and large amounts.
            </li>
            <li>DJED is designed that you can always burn $djed and get ada back</li>
            <li>Any other operations mint djed and burn/mint shen, is subject to a healthy collateralization</li>
            <li>$ada price in usd affect collateralization, test it buy adding or removing 1c</li>
            <li>$ada price in usd affects $shen value directly. Look how good it is when ada price goes up #NFA</li>
            <li>Request fees: transaction fees that go into the reserve. It increases the reserve and the value of $shen </li>
            <li>Operational fees: fees that are paid to COTI </li>
          </ul>
        </div>
        <div>
          <h3>Shen holder advantages/perkes</h3>
          <ul>
            <li>Ada in the reserve are staked on stakepool, rewards will go into the reserve and increase both reserve and $shen value </li>
            <li>Transaction fees (shen and djed mint/burn) go in the reserve and increase both the reserve and $shen value</li>
            <li>There will be $shen Liquidity Pool on the major DEXes. Possibly farms and further incentives</li>
            <li>As you can experiment yourself, $shen appreciates if $ada appreciates. Investing for the long term could give nice earnings. #NFA.</li>
          </ul>
        </div>
      </div>
    </>
  )
}
