import Head from 'next/head'
import Image from 'next/image'
import { Inter } from '@next/font/google'
import styles from '@/styles/Home.module.css'
import { useEffect, useState } from "react"
import toast, { Toaster } from 'react-hot-toast'


const inter = Inter({ subsets: ['latin'] })

export default function Home() {

  const setup = {
    adaInitialPrice: 0.34,
    djedInitialSupply: 1000000,
    adaReserveInitialAmount: 4000000
  }

  const djedMintFeePct = 0.0015
  const djedBurnFeePct = 0.0015

  const shenMintFeePct = 0.0002
  const shenBurnFeePct = 0.0005

  const opFeePct = 0.005

  const [djedAmount, setDjedAmount] = useState(0)
  const [shenAmount, setShenAmount] = useState(0)
  const [adaUsdRate, setAdaUsdRate] = useState(0.5) // 1 ada is worth X usd
  const [adaReserveAmt, setAdaReserveAmt] = useState(0)

  const [shenPrice, setShenPrice] = useState(0.0)

  const [collateralPct, setCollateralPct] = useState(0.0)

  const [opFeeTotal, setOpFeeTotal] = useState(0.0)

  const [feeTotal, setFeeTotal] = useState(0.0)

  const [djedAmountToMint, setDjedAmountToMint] = useState(100)
  const [djedAmountToBurn, setDjedAmountToBurn] = useState(100)
  const [shenAmountToMint, setShenAmountToMint] = useState(100)
  const [shenAmountToBurn, setShenAmountToBurn] = useState(100)

  function calcCollPct(currentDjedSupply, currentAdaUsdRate, currentAdaReserveAmount) {

    const djedSupplyInAda = currentDjedSupply / currentAdaUsdRate
    console.log('djedSupplyInAda: ' + djedSupplyInAda)

    if (djedSupplyInAda == 0) {
      return 0.0
    } else {
      const reserve = currentAdaReserveAmount - djedSupplyInAda
      const rate = reserve / djedSupplyInAda
      return parseFloat(rate).toFixed(2) * 100
    }

  }

  function shenPriceInAda(currentShenAmount, currentAdaReserveAmount, currentDjedSupply, currentAdaUsdRate) {
    console.log('currentShenAmount: ' + currentShenAmount)

    const djedSupplyInAda = currentDjedSupply / currentAdaUsdRate
    console.log('djedSupplyInAda: ' + djedSupplyInAda)

    if (currentShenAmount > 0) {
      const priceInAda = ((currentAdaReserveAmount - djedSupplyInAda) / currentShenAmount)
      return parseFloat(priceInAda).toFixed(6)
    } else {
      return 1.0 / adaUsdRate
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

    const opFee = opFeePct * adaToBeAddedInReserve
    console.log('opFee: ' + opFee)

    const fee = shenMintFeePct * adaToBeAddedInReserve
    console.log('fee: ' + fee)

    const newAdaReserveAmt = adaReserveAmt + fee + adaToBeAddedInReserve
    console.log('newAdaReserveAmt: ' + newAdaReserveAmt)

    const coll = calcCollPct(djedAmount, adaUsdRate, newAdaReserveAmt)
    console.log('coll: ' + coll)

    if (coll != 0 && coll > 800) {
      toast.error('Too much collateralization, buy some $DJED first')
      return
    }

    const newShenPriceInAda = shenPriceInAda(totalShenAmount, newAdaReserveAmt, djedAmount, adaUsdRate)
    console.log('newShenPriceInAda: ' + newShenPriceInAda)
    setShenPrice(newShenPriceInAda)

    setShenAmount(totalShenAmount)
    setAdaReserveAmt(newAdaReserveAmt)
    setOpFeeTotal(opFeeTotal + opFee)
    setFeeTotal(feeTotal + fee)

    setCollateralPct(coll)
  }

  async function burnShen(shenAmountToBurn) {

    const totalShenAmount = shenAmount - shenAmountToBurn

    const currentShenPriceInAda = shenPriceInAda(shenAmount, adaReserveAmt, djedAmount, adaUsdRate)
    console.log('currentShenPriceInAda: ' + currentShenPriceInAda)

    const adaToBeRemovedFromReserve = currentShenPriceInAda * shenAmountToBurn
    console.log('adaToBeRemovedFromReserve: ' + adaToBeRemovedFromReserve)

    const opFee = opFeePct * adaToBeRemovedFromReserve
    console.log('opFee: ' + opFee)

    const fee = shenBurnFeePct * adaToBeRemovedFromReserve
    console.log('fee: ' + fee)

    const newAdaReserveAmt = adaReserveAmt + fee - adaToBeRemovedFromReserve
    console.log('newAdaReserveAmt: ' + newAdaReserveAmt)

    const coll = calcCollPct(djedAmount, adaUsdRate, newAdaReserveAmt)
    console.log('coll: ' + coll)

    if (coll != 0 && coll < 400) {
      toast.error('Not enough collateral')
      return
    }

    setShenAmount(totalShenAmount)
    setAdaReserveAmt(newAdaReserveAmt)
    setOpFeeTotal(opFeeTotal + opFee)
    setFeeTotal(feeTotal + fee)

    const newShenPriceInAda = shenPriceInAda(totalShenAmount, newAdaReserveAmt, djedAmount, adaUsdRate)
    console.log('newShenPriceInAda: ' + newShenPriceInAda)
    setShenPrice(newShenPriceInAda)


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
      toast.error('Not enough collateral. Buy some $SHEN first')
      return
    }

    setDjedAmount(totalDjedAmount)

    setAdaReserveAmt(newAdaReserveAmt)
    setOpFeeTotal(opFeeTotal + opFee)
    setFeeTotal(feeTotal + fee)

    const newShenPriceInAda = shenPriceInAda(shenAmount, newAdaReserveAmt, totalDjedAmount, adaUsdRate)
    console.log('newShenPriceInAda: ' + newShenPriceInAda)
    setShenPrice(newShenPriceInAda)

    setCollateralPct(coll)
  }

  async function burnDjed(djedAmountToBurn) {

    const totalDjedAmount = djedAmount - djedAmountToBurn
    console.log('totalDjedAmount: ' + totalDjedAmount)

    const adaToBeRemoedFromReserve = djedAmountToBurn / adaUsdRate
    console.log('adaToBeAddedInReserve: ' + adaToBeRemoedFromReserve)

    const opFee = opFeePct * adaToBeRemoedFromReserve
    console.log('opFee: ' + opFee)

    const fee = djedBurnFeePct * adaToBeRemoedFromReserve
    console.log('fee: ' + fee)

    const newAdaReserveAmt = adaReserveAmt + fee - adaToBeRemoedFromReserve
    console.log('newAdaReserveAmt: ' + newAdaReserveAmt)

    const coll = calcCollPct(totalDjedAmount, adaUsdRate, newAdaReserveAmt)
    console.log('coll: ' + coll)

    if (coll != 0 && coll < 400) {
      toast.error('Not enough collateral. Buy some $SHEN first')
      return
    }

    setDjedAmount(totalDjedAmount)

    setAdaReserveAmt(newAdaReserveAmt)
    setOpFeeTotal(opFeeTotal + opFee)
    setFeeTotal(feeTotal + fee)

    const newShenPriceInAda = shenPriceInAda(shenAmount, newAdaReserveAmt, totalDjedAmount, adaUsdRate)
    console.log('newShenPriceInAda: ' + newShenPriceInAda)
    setShenPrice(newShenPriceInAda)

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
      <main className={styles.main}>
        <h1>Play with Djed</h1>
        <h2>Unofficial, educational website to experiment with Cardano/COTI Djed Stablecoin</h2>
        <p>
          Djed Supply: {djedAmount} - Djed Supply in ADA: {djedAmount / adaUsdRate}
        </p>
        <p>
          Shen Supply: {shenAmount} - Shen Supply in ADA: {parseFloat(shenAmount * shenPrice).toFixed(4)} - Shen Price in Ada (estimated): {shenPrice}
        </p>
        <p>
          Ada Reserve: {adaReserveAmt - djedAmount / adaUsdRate} / Collateral (%): {collateralPct}
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
            <li>DJED is designed that you can always burn $djed and get ada back</li>
            <li>Any other operations mint djed and burn/mint shen, is subject to a healthy collateralization</li>
            <li>$ada price in usd affect collateralization, test it buy adding or removing 1c</li>
            <li>$ada price in usd affects $shen value directly. Look how good it is when ada price goes up #NFA</li>
          </ul>
        </div>
      </main>
    </>
  )
}
