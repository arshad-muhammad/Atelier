'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CheckoutModal from '@/components/CheckoutModal';
import { getCourseById, getLecturers, getMaterials, getStudentProfileByEmail, getSchedule, getCourseSyllabus } from '../../actions';
import styles from './course-detail.module.css';

// ── Tech icon map (SVG paths rendered inline, no external deps) ──
const TOOL_ICONS = {
  'react': (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="2.5" fill="#61DAFB"/>
      <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61DAFB" strokeWidth="1.2" fill="none"/>
      <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61DAFB" strokeWidth="1.2" fill="none" transform="rotate(60 12 12)"/>
      <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61DAFB" strokeWidth="1.2" fill="none" transform="rotate(120 12 12)"/>
    </svg>
  ),
  'node.js': (
    <svg viewBox="0 0 24 24" fill="#68a063"><path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.5 3.75v7.14L12 18.82l-7.5-3.75V7.93L12 4.18z"/></svg>
  ),
  'next.js': (
    <svg viewBox="0 0 24 24" fill="white"><path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.049-.106.005-4.703.007-4.705.073-.091a.637.637 0 0 1 .174-.143c.096-.047.134-.052.54-.052.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.573 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 0 1 .237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 0 1 .233-.296c.096-.05.13-.054.5-.054z"/></svg>
  ),
  'typescript': (
    <svg viewBox="0 0 24 24" fill="#3178c6"><path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z"/></svg>
  ),
  'python': (
    <svg viewBox="0 0 24 24" fill="#3776ab"><path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05L0 11.97l.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.26-.02.21-.01h5.74l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.37.1-.35.07-.32.04-.27.02-.21V6.07h2.09l.14.01zm-6.47 14.25ad-.23.33-.08.41.08.37.22.29.29.18.37.11.42.03.43-.04.4-.13.34-.23.26-.34.17-.46.06-.59-.06-.7-.17-.73-.28-.73-.39-.72-.49-.69-.59-.64-.68-.57-.77-.48-.83-.38-.87-.27-.89-.14-.9 0-.87.16-.83.32-.76.46-.68.61-.57.74-.46.86-.33.96-.2 1.04-.06 1.08.06 1.06.2 1.02.34.95.47.87.6.77.7.65.79.52.86.39.91.25.94.1.95-.03.92-.17.87-.3.81-.42.72-.53.62-.63.5-.7.37-.76.23-.8.09-.82-.05-.81-.19-.77-.33-.71-.46-.63-.58-.54-.68-.43-.76-.31-.82-.19-.85-.08-.85.04zm.1 4.72l.16.01.13.04.1.07.07.09.04.12.01.14-.01.14-.04.12-.07.1-.1.07-.13.04-.16.01-.16-.01-.13-.04-.1-.07-.07-.1-.04-.12-.01-.14.01-.14.04-.12.07-.09.1-.07.13-.04.16-.01z"/></svg>
  ),
  'mongodb': (
    <svg viewBox="0 0 24 24" fill="#47A248"><path d="M17.193 9.555c-1.264-5.58-4.252-7.414-4.573-8.115-.28-.394-.53-.954-.735-1.44-.036.495-.055.98-.165 1.44C10.833.43 8.812 2.48 7.568 9.06c-.859 4.51.87 7.98 3.045 10.006.59.55 1.294 1.075 2.14 1.525-.04-.57-.064-1.12-.065-1.68v-.012c0-.36.012-.72.035-1.08.014-.24.042-.48.075-.715.117-.85.31-1.68.575-2.48.18-.56.4-1.118.68-1.66.236-.478.5-.945.8-1.39.122-.19.25-.376.385-.557.135-.182.277-.36.425-.532.29-.342.608-.668.95-.978.15-.134.307-.263.467-.387l.11-.09-.01-.015-.015.005z"/></svg>
  ),
  'aws': (
    <svg viewBox="0 0 24 24" fill="#FF9900"><path d="M6.763 10.036c0 .296.032.535.088.71.064.176.144.368.256.576a.35.35 0 0 1 .056.176c0 .08-.048.16-.152.24l-.503.336a.383.383 0 0 1-.208.072c-.08 0-.16-.04-.239-.112a2.47 2.47 0 0 1-.287-.375 6.18 6.18 0 0 1-.248-.471c-.622.734-1.405 1.101-2.347 1.101-.67 0-1.205-.191-1.596-.574-.391-.384-.59-.894-.59-1.533 0-.678.239-1.23.726-1.644.487-.415 1.133-.623 1.955-.623.272 0 .551.024.846.064.296.04.6.104.918.176v-.583c0-.607-.127-1.03-.375-1.277-.255-.248-.686-.367-1.3-.367-.28 0-.568.031-.863.103-.295.072-.583.16-.862.272a2.287 2.287 0 0 1-.28.104.488.488 0 0 1-.127.023c-.112 0-.168-.08-.168-.247v-.391c0-.128.016-.224.056-.28a.597.597 0 0 1 .224-.167c.279-.144.614-.264 1.005-.36a4.84 4.84 0 0 1 1.246-.151c.95 0 1.644.216 2.091.647.439.43.662 1.085.662 1.963v2.586zm-3.24 1.214c.263 0 .534-.048.822-.144.287-.096.543-.271.758-.51.128-.152.224-.32.272-.512.047-.191.08-.423.08-.694v-.335a6.66 6.66 0 0 0-.735-.136 6.02 6.02 0 0 0-.75-.048c-.535 0-.926.104-1.19.32-.263.215-.39.518-.39.917 0 .375.095.655.295.846.191.2.47.296.837.296zm6.41.862c-.144 0-.24-.024-.304-.08-.064-.048-.12-.16-.168-.311L7.586 5.55a1.398 1.398 0 0 1-.072-.32c0-.128.064-.2.191-.2h.783c.151 0 .255.025.31.08.065.048.113.16.16.312l1.342 5.284 1.245-5.284c.04-.16.088-.264.151-.312a.549.549 0 0 1 .32-.08h.638c.152 0 .256.025.32.08.063.048.12.16.151.312l1.261 5.348 1.381-5.348c.048-.16.104-.264.16-.312a.52.52 0 0 1 .311-.08h.743c.127 0 .2.065.2.2 0 .04-.009.08-.017.128a1.137 1.137 0 0 1-.056.2l-1.923 6.17c-.048.16-.104.263-.168.311a.51.51 0 0 1-.303.08h-.687c-.151 0-.255-.024-.32-.08-.063-.056-.12-.16-.15-.32l-1.238-5.148-1.23 5.14c-.04.16-.088.264-.15.32-.065.056-.177.08-.32.08zm10.256.215c-.415 0-.83-.048-1.229-.143-.399-.096-.71-.2-.918-.32-.128-.071-.215-.151-.247-.223a.563.563 0 0 1-.048-.224v-.407c0-.167.064-.247.183-.247.048 0 .096.008.144.024.048.016.12.048.2.08.271.12.566.215.878.279.319.064.63.096.95.096.502 0 .894-.088 1.165-.264a.86.86 0 0 0 .415-.758.777.777 0 0 0-.215-.559c-.144-.151-.416-.287-.807-.415l-1.157-.36c-.583-.183-1.014-.454-1.277-.813a1.902 1.902 0 0 1-.4-1.158c0-.335.073-.63.216-.886.144-.255.335-.479.575-.654.24-.184.51-.32.83-.415.32-.096.655-.136 1.006-.136.175 0 .359.008.535.032.183.024.35.056.51.088.16.04.312.08.455.127.144.048.256.096.336.144a.69.69 0 0 1 .24.2.43.43 0 0 1 .071.263v.375c0 .168-.064.256-.184.256a.83.83 0 0 1-.303-.096 3.652 3.652 0 0 0-1.532-.311c-.455 0-.815.071-1.062.223-.248.152-.375.383-.375.71 0 .224.08.416.24.567.159.152.454.304.877.44l1.134.358c.574.184.99.44 1.237.767.247.327.367.702.367 1.117 0 .343-.072.655-.207.926-.144.272-.336.511-.583.703-.248.2-.543.343-.886.447-.36.111-.734.167-1.142.167zM21.698 16.207c-2.626 1.94-6.442 2.969-9.722 2.969-4.598 0-8.74-1.7-11.87-4.526-.247-.223-.024-.527.27-.351 3.384 1.963 7.559 3.153 11.877 3.153 2.914 0 6.114-.607 9.06-1.852.439-.2.814.287.385.607zM22.792 14.961c-.336-.43-2.22-.207-3.074-.103-.255.032-.295-.192-.063-.36 1.5-1.053 3.967-.75 4.254-.399.287.36-.08 2.826-1.485 4.007-.215.184-.423.088-.327-.151.32-.79 1.03-2.57.695-2.994z"/></svg>
  ),
  'docker': (
    <svg viewBox="0 0 24 24" fill="#2496ED"><path d="M13.983 11.078h2.119a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.119a.185.185 0 0 0-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 0 0 .186-.186V3.574a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 0 0 .186-.186V6.29a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 0 0 .184-.186V6.29a.185.185 0 0 0-.185-.185H8.1a.185.185 0 0 0-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 0 0 .185-.186V6.29a.185.185 0 0 0-.185-.185H5.136a.186.186 0 0 0-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 0 0 .185-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.186.186 0 0 0-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.185.185v1.888c0 .102.083.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 0 0-.75.748 11.376 11.376 0 0 0 .692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 0 0 3.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288z"/></svg>
  ),
  'postgresql': (
    <svg viewBox="0 0 24 24" fill="#336791"><path d="M17.128 0a10.134 10.134 0 0 0-2.755.403l-.063.02A10.922 10.922 0 0 0 12.6.258C11.422.238 10.41.524 9.594 1.086a8.413 8.413 0 0 0-.474-.093c-.944-.17-1.765-.087-2.463.191C4.793 2.018 3.87 3.836 3.45 5.483c-.27 1.065-.329 2.169-.171 3.073.072.41.201.836.372 1.228-1.57 2.021-1.77 4.316-1.027 5.935.25.539.6.976 1.022 1.258.3.2.852.376 1.555.217.2.335.427.653.683.94a6.878 6.878 0 0 0 .13.142c-.299.81-.303 1.56-.017 2.163.322.68.986 1.112 1.933 1.232.386.05.822.04 1.243-.077.376.308.775.573 1.19.772a4.218 4.218 0 0 0 3.898-.072 4.554 4.554 0 0 0 1.172-.906c.375.12.768.19 1.17.196.863.013 1.614-.3 2.072-.874.421-.524.543-1.2.4-1.906.127-.14.248-.283.362-.429 1.436-1.832 1.612-4.272.655-5.756a4.303 4.303 0 0 0-.538-.624c.126-.426.187-.921.14-1.539-.078-1.006-.454-1.773-.968-2.305.07-.15.134-.304.188-.462.308-.91.3-1.984-.207-2.981-.507-.997-1.354-1.73-2.394-2.051a4.452 4.452 0 0 0-.486-.118 3.944 3.944 0 0 0-.62-.032zM9.5 1.8c.38 0 .758.045 1.125.134a6.65 6.65 0 0 0-.586.522c-.673.694-1.237 1.655-1.537 2.836a9.032 9.032 0 0 0-.24 1.423 6.565 6.565 0 0 0-.617-.063c-.77-.03-1.456.158-2.005.504.04-.36.1-.72.186-1.058C6.17 4.43 6.96 2.897 8.34 2.323c.36-.149.742-.22 1.129-.208.01 0 .021-.002.031-.002zm4.402.05c.863.017 1.593.303 2.098.827.491.508.779 1.222.847 2.11.046.598-.014 1.05-.13 1.384a3.5 3.5 0 0 0-.394-.069c-.044-.006-.089-.01-.134-.015.086-.62.064-1.282-.082-1.873-.218-.884-.703-1.612-1.404-2.001a2.19 2.19 0 0 0-.217-.11c.143-.152.29-.28.453-.387a.938.938 0 0 1 .15-.079 1.86 1.86 0 0 1 .814.213zm-5.33 3.43c.11 0 .225.01.332.03.103.018.205.046.304.083a5.19 5.19 0 0 0-.09.77c-.026.735.083 1.5.379 2.18a4.53 4.53 0 0 0 .94 1.43c-.37.135-.73.316-1.063.546-.283.197-.535.425-.748.677a4.545 4.545 0 0 1-.468-1.05 6.892 6.892 0 0 1-.284-1.837c-.02-.87.128-1.715.384-2.398.186-.5.43-.896.714-1.163.17-.156.358-.249.6-.268zm6.484.254c.11-.003.22.003.33.018.617.085 1.178.49 1.477 1.175.236.535.3 1.216.16 1.875a3.64 3.64 0 0 0-.83-.206 5.637 5.637 0 0 0-.724-.045c.076-.495.065-1.002-.073-1.44a2.54 2.54 0 0 0-.48-.845 1.5 1.5 0 0 1 .14-.532zm-8.395 2.13c1.055-.027 1.939.53 2.344 1.44l.017.04a4.62 4.62 0 0 0-.617.666c-.2.264-.364.553-.492.857a2.9 2.9 0 0 0-.267-.32c-.4-.43-.979-.73-1.697-.782a3.55 3.55 0 0 0-.36-.012c-.233 0-.468.026-.694.077a4.12 4.12 0 0 1-.04-.46c-.015-.87.31-1.665.915-2.163.33-.27.734-.43 1.205-.484a2.766 2.766 0 0 1 .15-.007.826.826 0 0 1-.036-.054c.182-.015.371-.024.572-.018zm6.635.18c.204 0 .41.016.614.047.697.105 1.288.48 1.652 1.02.363.54.488 1.234.361 1.97-.129.74-.534 1.42-1.135 1.895-.602.478-1.36.695-2.077.614-.718-.083-1.347-.444-1.742-1.013-.396-.57-.524-1.296-.357-2.045.03-.13.069-.26.114-.385.136.052.276.094.42.124.22.045.445.064.668.056a3.08 3.08 0 0 0 1.478-.437c.41-.246.724-.6.91-1.015.028-.067.055-.134.079-.202a2.95 2.95 0 0 0-.005-.63zm-6.2 1.67c.614.036 1.07.342 1.32.774.178.306.254.68.222 1.072a3.27 3.27 0 0 0-.7-.077c-.42-.01-.84.052-1.23.176-.11-.207-.167-.453-.156-.716.02-.47.24-.9.614-1.15a1.2 1.2 0 0 1 .067-.04c.28-.07.561-.05.862-.039z"/></svg>
  ),
  'git': (
    <svg viewBox="0 0 24 24" fill="#F05032"><path d="M23.546 10.93L13.067.452c-.604-.603-1.582-.603-2.188 0L8.708 2.627l2.76 2.76c.645-.215 1.379-.07 1.889.441.516.515.658 1.258.438 1.9l2.658 2.66c.645-.223 1.387-.078 1.9.435.721.72.721 1.884 0 2.604-.719.719-1.881.719-2.6 0-.539-.541-.674-1.337-.404-1.996L12.86 8.955v6.525c.176.086.342.203.488.348.713.721.713 1.883 0 2.6-.719.721-1.889.721-2.609 0-.719-.719-.719-1.879 0-2.598.182-.18.387-.316.605-.406V8.835c-.217-.091-.424-.222-.6-.401-.545-.545-.676-1.342-.396-2.009L7.636 3.7.45 10.881c-.6.605-.6 1.584 0 2.189l10.48 10.477c.604.604 1.582.604 2.186 0l10.43-10.43c.605-.603.605-1.582 0-2.187"/></svg>
  ),
  'javascript': (
    <svg viewBox="0 0 24 24" fill="#F7DF1E"><rect width="24" height="24" rx="3" fill="#F7DF1E"/><path d="M6.86 16.714c.21.636.613.946 1.138.946.52 0 .85-.257.85-.607 0-.42-.34-.569-.912-.813l-.313-.135c-.906-.384-1.508-.869-1.508-1.89 0-.94.717-1.655 1.836-1.655.797 0 1.37.278 1.784.999l-.977.628c-.215-.384-.447-.535-.807-.535-.367 0-.6.232-.6.535 0 .374.233.524.771.754l.312.135c1.068.456 1.671.924 1.671 1.97 0 1.128-.887 1.748-2.079 1.748-1.165 0-1.918-.556-2.285-1.285l1.12-.795zm4.842.24c.226.44.43.812.922.812.471 0 .769-.184.769-.9V13h1.32v3.91c0 1.483-.87 2.156-2.14 2.156-1.148 0-1.813-.593-2.152-1.309l1.281-.803z" fill="#000"/></svg>
  ),
  'css': (
    <svg viewBox="0 0 24 24" fill="#1572B6"><path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm17.09 4.413L5.41 4.41l.213 2.622 10.125.002-.255 2.716h-6.64l.24 2.573h6.182l-.366 3.523-2.91.804-2.956-.81-.188-2.11h-2.61l.29 3.855L12 19.288l5.373-1.53L18.59 4.414v-.001z"/></svg>
  ),
  'tailwind': (
    <svg viewBox="0 0 24 24" fill="#06B6D4"><path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z"/></svg>
  ),
  'redis': (
    <svg viewBox="0 0 24 24" fill="#DC382D"><path d="M10.9 7.1L8.5 8.4l2.4 1.3 2.4-1.3zm2.5 2.9l-2.5 1.3-2.5-1.3v-3L8.5 6l-6 3.3v2.1l9 4.9 9-4.9V9.3zm-9-1.6l2.4-1.3 2.4 1.3-2.4 1.3zM2.5 9.5l2.4-1.3 2.4 1.3-2.4 1.3zm9 9.6l-9-4.9V12l9 4.9 9-4.9v2.2zm0 3.4l-9-4.9v-2.2l9 4.9 9-4.9v2.2z"/></svg>
  ),
};

const getToolIcon = (toolName) => {
  const key = toolName.trim().toLowerCase();
  return TOOL_ICONS[key] || (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
    </svg>
  );
};

// ── Animated stat counter ──
function StatCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const numericTarget = parseInt(target?.replace(/\D/g, '') || '0', 10);
    if (!numericTarget) { setCount(target || '0'); return; }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const duration = 1800;
        const step = (timestamp) => {
          if (!start) start = timestamp;
          const progress = Math.min((timestamp - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * numericTarget));
          if (progress < 1) requestAnimationFrame(step);
          else setCount(target);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.5 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref} className={styles.statValue}>{count}{suffix}</span>;
}

// ── Curriculum Line Parser ──
function parseCurriculumLine(line) {
  if (!line || !line.trim()) return null;
  const str = line.trim();

  // Pattern 1: Title (topic1, topic2, topic3...)
  const parenMatch = str.match(/^([^(]+)\s*\((.+)\)\s*$/);
  if (parenMatch) {
    const title = parenMatch[1].trim();
    const details = parenMatch[2].trim();
    const topics = details.split(',').map(s => s.trim()).filter(Boolean);
    return {
      q: title,
      a: `In this module, you will build and master: ${details}.`,
      topics: topics
    };
  }

  // Pattern 2: Title — Description or Title - Description or Title | Description
  const dashParts = str.split(/\s+[—\-|]\s+/);
  if (dashParts.length >= 2) {
    const title = dashParts[0].trim();
    const rest = dashParts.slice(1).join(' — ').trim();
    const topics = rest.split(',').map(s => s.trim()).filter(Boolean);
    return {
      q: title,
      a: rest,
      topics: topics.length > 1 ? topics : []
    };
  }

  // Pattern 3: Week X: Title: Description
  const colonParts = str.split(':');
  if (colonParts.length >= 3) {
    const title = `${colonParts[0].trim()}: ${colonParts[1].trim()}`;
    const rest = colonParts.slice(2).join(':').trim();
    const topics = rest.split(',').map(s => s.trim()).filter(Boolean);
    return {
      q: title,
      a: rest,
      topics: topics.length > 1 ? topics : []
    };
  }

  // Fallback
  return {
    q: str,
    a: `Comprehensive hands-on module covering architectural patterns, live code implementation, and industry workflows.`,
    topics: []
  };
}

// ── Accordion item ──
function AccordionItem({ item, index, isOpen, onToggle }) {
  const bodyRef = useRef(null);

  const question = item?.q || item?.moduleTitle || item?.title || (typeof item === 'string' ? item : '');
  const answer = item?.a || item?.description || item?.desc || '';
  const topics = item?.topics || [];

  return (
    <div className={`${styles.accordionItem} ${isOpen ? styles.accordionItemOpen : ''}`}>
      <button 
        type="button" 
        className={styles.accordionTrigger} 
        onClick={() => onToggle(index)}
        aria-expanded={isOpen}
      >
        <div className={styles.accordionLeft}>
          <span className={styles.accordionNum}>{String(index + 1).padStart(2, '0')}</span>
          <span className={styles.accordionQ}>{question}</span>
        </div>
        <svg 
          className={`${styles.accordionIcon} ${isOpen ? styles.accordionIconOpen : ''}`} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div 
        ref={bodyRef} 
        className={styles.accordionBody} 
        style={{ 
          maxHeight: isOpen ? `${(bodyRef.current?.scrollHeight || 300) + 40}px` : '0px' 
        }}
      >
        <div className={styles.accordionInner}>
          {answer && <p className={styles.accordionAns}>{answer}</p>}
          {topics.length > 0 && (
            <div className={styles.accordionTopics}>
              {topics.map((t, tidx) => (
                <div key={tidx} className={styles.accordionTopicItem}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.accordionTopicCheck}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>{typeof t === 'string' ? t : (t.title || t.name)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Scroll reveal hook ──
function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setRevealed(true); observer.disconnect(); }
    }, { threshold: options.threshold || 0.1, rootMargin: options.rootMargin || '0px 0px -50px 0px' });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, revealed];
}

// ── Reveal wrapper ──
function Reveal({ children, className = '', delay = 0, direction = 'up' }) {
  const [ref, revealed] = useScrollReveal();
  const dirClass = direction === 'left' ? styles.revealLeft : direction === 'right' ? styles.revealRight : styles.revealUp;

  return (
    <div
      ref={ref}
      className={`${dirClass} ${revealed ? styles.revealed : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = parseInt(params.id, 10);

  const [course, setCourse] = useState(null);
  const [instructor, setInstructor] = useState(null);
  const [syllabusModules, setSyllabusModules] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [liveSchedule, setLiveSchedule] = useState([]);
  const [student, setStudent] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  const [openCurriculum, setOpenCurriculum] = useState(null);
  const heroRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      if (!courseId) return;
      try {
        const [cData, lecturersList, allMaterials, scheduleList, syllabusList] = await Promise.all([
          getCourseById(courseId),
          getLecturers(),
          getMaterials(),
          getSchedule(),
          getCourseSyllabus(courseId).catch(() => [])
        ]);

        if (!cData) { setLoading(false); return; }
        setCourse(cData);
        setSyllabusModules(Array.isArray(syllabusList) ? syllabusList : []);

        const inst = lecturersList.find(l => l.id === cData.instructorId);
        setInstructor(inst || { name: 'Expert Mentor', expertise: 'Full Stack & Product Engineering', bio: 'Industry veteran with 10+ years building at scale. Passionate about mentoring the next generation of developers.' });

        const syllabus = allMaterials.filter(m => m.courseId === courseId);
        setMaterials(syllabus);

        const courseSchedule = scheduleList.filter(s => s.courseId === courseId);
        setLiveSchedule(courseSchedule);

        const email = localStorage.getItem('loggedInStudentEmail');
        if (email) {
          const activeStudent = await getStudentProfileByEmail(email);
          if (activeStudent) {
            setStudent(activeStudent);
            setIsEnrolled((activeStudent.enrolledCourses || []).includes(courseId));
          }
        }
      } catch (err) {
        console.error("Error loading course details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [courseId]);

  // Parallax on hero image
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrollY = window.scrollY;
        const heroBg = heroRef.current.querySelector(`.${styles.heroBgBlob}`);
        if (heroBg) heroBg.style.transform = `translateY(${scrollY * 0.3}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleEnrollClick = () => {
    if (!student) { router.push(`/auth/signin?redirectTo=/courses/${courseId}`); return; }
    setShowCheckout(true);
  };

  const handleAccessWorkspace = () => {
    localStorage.setItem('activeCourseId', courseId.toString());
    window.dispatchEvent(new Event('courseChanged'));
    router.push('/dashboard');
  };

  const handlePaymentSuccess = async () => {
    setIsEnrolled(true);
    setShowCheckout(false);
    if (student) {
      const updatedStudent = await getStudentProfileByEmail(student.email);
      if (updatedStudent) {
        localStorage.setItem('studentProfile', JSON.stringify({
          name: updatedStudent.name,
          email: updatedStudent.email,
          phone: updatedStudent.phone || '',
          college: updatedStudent.college || '',
          degree: updatedStudent.degree || '',
          gradYear: updatedStudent.gradYear || '',
          bio: updatedStudent.bio || '',
          github: updatedStudent.github || '',
          linkedin: updatedStudent.linkedin || '',
          portfolio: updatedStudent.portfolio || '',
          skills: updatedStudent.skills || [],
          streak: updatedStudent.streak || 1,
          enrolledCourses: updatedStudent.enrolledCourses || [courseId]
        }));
      }
    }
    localStorage.setItem('activeCourseId', courseId.toString());
    window.dispatchEvent(new Event('profileChanged'));
    window.dispatchEvent(new Event('courseChanged'));
    router.push('/dashboard/my-courses');
  };

  // Parse structured data from course fields
  const highlights = course?.highlights ? course.highlights.split(',').map(s => s.trim()).filter(Boolean) : [];
  const tools = course?.toolsTechnologies ? course.toolsTechnologies.split(',').map(s => s.trim()).filter(Boolean) : [];
  const outcomes = course?.courseOutcomes ? course.courseOutcomes.split(',').map(s => s.trim()).filter(Boolean) : [];
  let faqs = [];
  try { faqs = course?.faqs ? JSON.parse(course.faqs) : []; } catch { faqs = []; }

  // Curriculum Roadmap items: Prioritize database syllabus modules, fallback to parsed curriculumOverview lines
  const curriculumRoadmapItems = React.useMemo(() => {
    if (syllabusModules && syllabusModules.length > 0) {
      return syllabusModules.map((mod) => ({
        q: mod.weekNumber ? `Week ${mod.weekNumber}: ${mod.moduleTitle}` : mod.moduleTitle,
        a: mod.description || '',
        topics: (mod.topics || []).map(t => t.title || t)
      }));
    }

    if (course?.curriculumOverview) {
      if (course.curriculumOverview.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(course.curriculumOverview);
          if (Array.isArray(parsed)) {
            return parsed.map(m => ({
              q: m.title ? (m.week ? `Week ${m.week}: ${m.title}` : m.title) : (m.q || 'Module'),
              a: m.desc || m.description || m.a || '',
              topics: m.topics || []
            }));
          }
        } catch {}
      }

      const rawLines = course.curriculumOverview.split('\n').map(s => s.trim()).filter(Boolean);
      return rawLines.map(line => parseCurriculumLine(line)).filter(Boolean);
    }

    return [];
  }, [syllabusModules, course?.curriculumOverview]);

  // ── Loading state ──
  if (loading) {
    return (
      <>
        <Navbar />
        <main className={styles.loadingShell}>
          <div className={styles.loadingGrid} />
          <div className={styles.loadingGlow} />
          <div className={styles.loadingContent}>
            <div className={styles.loadingSpinner} />
            <p className={styles.loadingText}>Fetching course credentials...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ── Not found state ──
  if (!course) {
    return (
      <>
        <Navbar />
        <main className={styles.loadingShell}>
          <div className={styles.loadingGrid} />
          <div className={styles.loadingGlow} />
          <div className={styles.notFound}>
            <div className={styles.notFoundIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2>Course Not Found</h2>
            <p>The requested program key does not exist in our active catalog.</p>
            <button className={styles.ctaBtn} onClick={() => router.push('/courses')}>
              <span>Back to Catalog</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ── Main render ──
  return (
    <>
      <Navbar />

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section ref={heroRef} className={styles.heroSection}>
        <div className={styles.heroBgGrid} />
        <div className={styles.heroBgBlob} />
        <div className={styles.heroNoise} />

        <div className={`${styles.heroContainer} container`}>
          <div className={styles.heroContent}>

            {/* Left column */}
            <div className={styles.heroLeft}>
              <div className={styles.heroBadgeRow}>
                <span className={styles.heroBadge}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:12,height:12}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  COHORT WORKSPACE
                </span>
                {course.batchStartDate && (
                  <span className={styles.heroBatchDate}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:12,height:12}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    STARTS: {course.batchStartDate}
                  </span>
                )}
                {course.duration && <span className={styles.heroDuration}>{course.duration}</span>}
              </div>

              <h1 className={styles.heroTitle}>
                {course.title}
              </h1>

              {course.subtitle && (
                <p className={styles.heroSubtitle}>{course.subtitle}</p>
              )}

              <p className={styles.heroDesc}>{course.description}</p>

              {/* Badges */}
              {course.badges && course.badges.length > 0 && (
                <div className={styles.heroBadges}>
                  {course.badges.map((badge, i) => (
                    <span key={i} className={styles.heroPill}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:12,height:12}}><polyline points="20 6 9 17 4 12"/></svg>
                      {badge.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* CTA buttons */}
              <div className={styles.heroActions}>
                {isEnrolled ? (
                  <button className={styles.ctaBtn} onClick={handleAccessWorkspace}>
                    <span>Access Workspace</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </button>
                ) : (
                  <button className={styles.ctaBtn} onClick={handleEnrollClick}>
                    <span>{student ? `Enroll Now - ${course.price || 'Free'}` : 'Sign In to Enroll'}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </button>
                )}
                <button className={styles.ctaBtnOutline} onClick={() => document.getElementById('curriculum-section')?.scrollIntoView({ behavior: 'smooth' })}>
                  View Curriculum
                </button>
              </div>

              {/* Pricing strip */}
              <div className={styles.heroPricingStrip}>
                <span className={styles.heroPriceMain}>{course.price || 'Free'}</span>
                {course.originalPrice && <span className={styles.heroPriceSlash}>{course.originalPrice}</span>}
                {course.discount && <span className={styles.heroDiscountBadge}>{course.discount}</span>}
                <span className={styles.heroPriceMeta}>• Limited seats remaining</span>
              </div>
            </div>

            {/* Right column - stats card */}
            <div className={styles.heroRight}>
              <div className={styles.heroStatsCard}>
                <div className={styles.heroStatsCardInner}>
                  <div className={styles.heroCourseImg}>
                    <img 
                      src={course.image || '/images/course_cohort_2.png'} 
                      alt={course.title} 
                      onError={(e) => { e.currentTarget.src = '/images/course_cohort_2.png'; }}
                    />
                    <div className={styles.heroCourseImgOverlay} />
                  </div>

                  <div className={styles.heroStatsGrid}>
                    {(course.totalHours || course.duration) && (
                      <div className={styles.heroStatItem}>
                        <div className={styles.heroStatIcon}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </div>
                        <StatCounter target={course.totalHours || '100'} suffix="+" />
                        <span className={styles.heroStatLabel}>Live Hours</span>
                      </div>
                    )}
                    {(course.totalModules || materials.length > 0) && (
                      <div className={styles.heroStatItem}>
                        <div className={styles.heroStatIcon}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                        </div>
                        <StatCounter target={course.totalModules || String(materials.length || curriculumRoadmapItems.length || '6')} suffix="+" />
                        <span className={styles.heroStatLabel}>Modules</span>
                      </div>
                    )}
                    {course.totalProjects && (
                      <div className={styles.heroStatItem}>
                        <div className={styles.heroStatIcon}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
                        </div>
                        <StatCounter target={course.totalProjects} suffix="+" />
                        <span className={styles.heroStatLabel}>Projects</span>
                      </div>
                    )}
                    <div className={styles.heroStatItem}>
                      <div className={styles.heroStatIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      </div>
                      <span className={styles.statValue}>24/7</span>
                      <span className={styles.heroStatLabel}>Support</span>
                    </div>
                  </div>

                  {/* Live sessions strip */}
                  {liveSchedule.length > 0 && (
                    <div className={styles.heroLiveStrip}>
                      <span className={styles.heroLiveDot} />
                      <span>Next Live: {liveSchedule[0].time} - {liveSchedule[0].title}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════ OUTCOMES / HIGHLIGHTS ═══════════ */}
      {(highlights.length > 0 || outcomes.length > 0) && (
        <section className={styles.outcomesSection}>
          <div className={`${styles.sectionContainer} container`}>
            <Reveal>
              <div className={styles.sectionLabel}>WHAT YOU WILL BUILD</div>
              <h2 className={styles.sectionTitle}>
                Build Real Products.<br />
                <span className={styles.textAccent}>Acquire Skills That Hire.</span>
              </h2>
            </Reveal>

            <div className={styles.outcomesGrid}>
              {(outcomes.length > 0 ? outcomes : highlights).map((item, i) => (
                <Reveal key={i} delay={i * 60}>
                  <div className={styles.outcomeCard}>
                    <div className={styles.outcomeCardNum}>{String(i + 1).padStart(2, '0')}</div>
                    <div className={styles.outcomeCardLine} />
                    <div className={styles.outcomeCardCheck}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <p className={styles.outcomeCardText}>{item}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ LEARNING ROADMAP (LIGHT SECTION) ═══════════ */}
      {(curriculumRoadmapItems.length > 0 || materials.length > 0) && (
        <section id="curriculum-section" data-theme="light" className={styles.learningRoadmapSection}>
          {curriculumRoadmapItems.length > 0 && (
            <div className={`${styles.sectionContainer} container`}>
              <Reveal>
                <div className={styles.sectionLabel}>CURRICULUM ROADMAP</div>
                <h2 className={styles.sectionTitle}>Week-by-Week<br /><span className={styles.textAccent}>Learning Path</span></h2>
              </Reveal>

              <div className={styles.curriculumList}>
                {curriculumRoadmapItems.map((item, i) => (
                  <Reveal key={i} delay={i * 40}>
                    <AccordionItem
                      item={item}
                      index={i}
                      isOpen={openCurriculum === i}
                      onToggle={(idx) => setOpenCurriculum(openCurriculum === idx ? null : idx)}
                    />
                  </Reveal>
                ))}
              </div>
            </div>
          )}

          {materials.length > 0 && (
            <div className={`${styles.sectionContainer} container ${curriculumRoadmapItems.length > 0 ? styles.syllabusContainerMerged : ''}`}>
              <Reveal>
                <div className={styles.sectionLabel}>COURSE MODULES</div>
                <h2 className={styles.sectionTitle}>Syllabus<br /><span className={styles.textAccent}>Directory Nodes</span></h2>
              </Reveal>

              <div className={styles.syllabusGrid}>
                {materials.map((module, i) => (
                  <Reveal key={module.id} delay={i * 60}>
                    <div className={styles.syllabusCard}>
                      <div className={styles.syllabusCardHeader}>
                        <div className={styles.syllabusCardIcon}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                        </div>
                        <h4 className={styles.syllabusCardTitle}>{module.title}</h4>
                        <span className={styles.syllabusCardCount}>{module.assets?.length || 0} assets</span>
                      </div>
                      {module.assets && module.assets.length > 0 && (
                        <div className={styles.syllabusAssets}>
                          {module.assets.map((asset, j) => (
                            <div key={j} className={styles.syllabusAsset}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:13,height:13,flexShrink:0}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                              <span>{asset.name}</span>
                              {asset.size && <span className={styles.syllabusAssetSize}>{asset.size}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ═══════════ TOOLS & TECHNOLOGIES ═══════════ */}
      {tools.length > 0 && (
        <section className={styles.toolsSection}>
          <div className={`${styles.sectionContainer} container`}>
            <Reveal>
              <div className={styles.sectionLabel}>TECH STACK</div>
              <h2 className={styles.sectionTitle}>Tools You'll<br /><span className={styles.textAccent}>Master</span></h2>
            </Reveal>

            <div className={styles.toolsGrid}>
              {tools.map((tool, i) => (
                <Reveal key={i} delay={i * 50}>
                  <div className={styles.toolCard}>
                    <div className={styles.toolIcon}>{getToolIcon(tool)}</div>
                    <span className={styles.toolName}>{tool}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ INSTRUCTOR ═══════════ */}
      {instructor && (
        <section className={styles.instructorSection}>
          <div className={`${styles.sectionContainer} container`}>
            <Reveal>
              <div className={styles.sectionLabel}>YOUR MENTOR</div>
              <h2 className={styles.sectionTitle}>Learn From<br /><span className={styles.textAccent}>The Best</span></h2>
            </Reveal>

            <Reveal delay={150}>
              <div className={styles.instructorCard}>
                <div className={styles.instructorImgWrap}>
                  <img
                    src={instructor.avatar || '/images/avatar1.jpg'}
                    alt={instructor.name}
                    className={styles.instructorImg}
                    onError={(e) => { e.currentTarget.src = '/images/avatar1.jpg'; }}
                  />
                  <div className={styles.instructorImgGlow} />
                </div>
                <div className={styles.instructorInfo}>
                  <div className={styles.instructorBadge}>Lead Instructor</div>
                  <h3 className={styles.instructorName}>{instructor.name}</h3>
                  <span className={styles.instructorExpertise}>{instructor.expertise}</span>
                  {instructor.bio && <p className={styles.instructorBio}>{instructor.bio}</p>}
                  <div className={styles.instructorStats}>
                    <div className={styles.instructorStat}>
                      <span className={styles.instructorStatVal}>500+</span>
                      <span className={styles.instructorStatLabel}>Students Mentored</span>
                    </div>
                    <div className={styles.instructorStat}>
                      <span className={styles.instructorStatVal}>10+</span>
                      <span className={styles.instructorStatLabel}>Years Experience</span>
                    </div>
                    <div className={styles.instructorStat}>
                      <span className={styles.instructorStatVal}>4.9★</span>
                      <span className={styles.instructorStatLabel}>Avg. Rating</span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ═══════════ CERTIFICATE (LIGHT SECTION) ═══════════ */}
      <section data-theme="light" className={styles.certSection}>
        <div className={`${styles.sectionContainer} container`}>
          <Reveal>
            <div className={styles.sectionLabel}>RECOGNITION</div>
            <h2 className={styles.sectionTitle}>Get Certified<br /><span className={styles.textAccent}>On Completion</span></h2>
          </Reveal>

          <Reveal delay={150}>
            <div className={styles.certCard}>
              <div className={styles.certLeft}>
                <div className={styles.certMockup}>
                  <div className={styles.certMockupHeader}>
                    <img src="/logo.png" alt="Atelier" style={{width:32,height:32,objectFit:'contain'}} />
                    <span>Atelier - Sphere Hive Academy</span>
                  </div>
                  <div className={styles.certMockupTitle}>Certificate of Completion</div>
                  <div className={styles.certMockupName}>Your Name Here</div>
                  <div className={styles.certMockupCourse}>{course.certificateTitle || course.title}</div>
                  <div className={styles.certMockupSeal}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>
                    <span>Verified</span>
                  </div>
                </div>
              </div>
              <div className={styles.certRight}>
                <h3 className={styles.certHeading}>Your efforts, certified by experts.</h3>
                <p className={styles.certDesc}>
                  Upon completing the {course.certificateTitle || course.title}, you'll receive a
                  verified industry certificate detailing the projects you built, hackathons
                  participated in, and the technical skills you mastered.
                </p>
                <div className={styles.certFeatures}>
                  {['Shareable on LinkedIn', 'Projects documented', 'Industry-verified', 'Lifetime access'].map((f, i) => (
                    <div key={i} className={styles.certFeature}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:14,height:14,color:'var(--accent-orange)',flexShrink:0}}><polyline points="20 6 9 17 4 12"/></svg>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <button className={styles.ctaBtn} onClick={handleEnrollClick}>
                  <span>{isEnrolled ? 'Access Workspace' : student ? 'Enroll to Earn Certificate' : 'Sign In to Enroll'}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      {faqs.length > 0 && (
        <section className={styles.faqSection}>
          <div className={`${styles.sectionContainer} container`}>
            <Reveal>
              <div className={styles.sectionLabel}>HAVE QUESTIONS?</div>
              <h2 className={styles.sectionTitle}>Frequently Asked<br /><span className={styles.textAccent}>Questions</span></h2>
            </Reveal>

            <div className={styles.faqList}>
              {faqs.map((faq, i) => (
                <Reveal key={i} delay={i * 50}>
                  <AccordionItem item={faq} index={i} isOpen={openFaq === i} onToggle={(idx) => setOpenFaq(openFaq === idx ? null : idx)} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ PRICING CARD SECTION ═══════════ */}
      <section className={styles.pricingCardSection} id="pricing">
        <div className={styles.pricingCardGridBg} />
        <div className={`${styles.sectionContainer} container`}>
          <Reveal>
            <div className={styles.pricingCardWrap}>
              <div className={styles.pricingCard}>
                {/* Vibrant ambient orange glow in top-left */}
                <div className={styles.pricingCardGlowLeft} />

                {/* Decorative abstract 3D ribbon & sparkles in top-right */}
                <div className={styles.pricingCardDecorRight}>
                  <svg viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.pricingDecorSvg}>
                    <defs>
                      <linearGradient id="glowGradRibbon" x1="20%" y1="0%" x2="80%" y2="100%">
                        <stop offset="0%" stopColor="#bf5022" stopOpacity="0.45" />
                        <stop offset="60%" stopColor="#692410" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#250d06" stopOpacity="0.05" />
                      </linearGradient>
                      <filter id="softRibbonBlur" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="8" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    <path d="M140 15 C185 45, 205 105, 175 160 C150 195, 100 205, 80 170 C60 135, 95 85, 140 65" stroke="url(#glowGradRibbon)" strokeWidth="28" strokeLinecap="round" filter="url(#softRibbonBlur)" />
                    <path d="M180 50 C205 90, 195 145, 150 190 C105 220, 50 195, 40 150" stroke="url(#glowGradRibbon)" strokeWidth="20" strokeLinecap="round" opacity="0.6" />
                    <path d="M185 75 Q185 83 193 83 Q185 83 185 91 Q185 83 177 83 Q185 83 185 75 Z" fill="#d97742" opacity="0.75" />
                    <path d="M155 42 Q155 48 161 48 Q155 48 155 54 Q155 48 149 48 Q155 48 155 42 Z" fill="#d97742" opacity="0.55" />
                    <path d="M202 125 Q202 129 206 129 Q202 129 202 133 Q202 129 198 129 Q202 129 202 125 Z" fill="#d97742" opacity="0.45" />
                  </svg>
                </div>

                <div className={styles.pricingCardGrid}>
                  {/* Left Column */}
                  <div className={styles.pricingCardLeft}>
                    <h3 className={styles.pricingCourseTitle}>
                      {course.title || 'Data Science and Analytics with GenAI'}
                    </h3>

                    <p className={styles.pricingCourseDesc}>
                      {course.subtitle || course.description || 'Gain hands-on experience in data analysis, visualization, and AI integration.'}
                    </p>

                    <div className={styles.pricingPriceRow}>
                      <span className={styles.pricingPriceMain}>
                        {(() => {
                          const val = course.price;
                          if (!val) return '₹ 9799';
                          if (String(val).toLowerCase() === 'free') return 'Free';
                          const d = String(val).replace(/[^0-9]/g, '');
                          return d ? `₹ ${d}` : val;
                        })()}
                      </span>
                      {(() => {
                        const val = course.originalPrice;
                        const d = val ? String(val).replace(/[^0-9]/g, '') : '19999';
                        return <span className={styles.pricingPriceSlash}>{`₹ ${d}`}</span>;
                      })()}
                      <span className={styles.pricingPriceTax}>(+ GST)</span>
                    </div>

                    <button
                      className={styles.pricingEnrollBtn}
                      onClick={isEnrolled ? handleAccessWorkspace : handleEnrollClick}
                    >
                      {isEnrolled ? 'Access Workspace' : 'Enroll Now'}
                    </button>
                  </div>

                  {/* Right Column */}
                  <div className={styles.pricingCardRight}>
                    <div className={styles.pricingBadgeRow}>
                      <span className={styles.pricingPopularBadge}>Most popular</span>
                    </div>

                    <div className={styles.pricingMetaList}>
                      <div className={styles.pricingMetaItem}>
                        <span className={styles.pricingMetaLabel}>Duration</span>
                        <span className={styles.pricingMetaValue}>
                          {course.duration || (course.totalHours ? `${course.totalHours}+ Hours` : '115+ Hours')}
                        </span>
                      </div>
                      <div className={styles.pricingMetaItem}>
                        <span className={styles.pricingMetaLabel}>Category</span>
                        <span className={styles.pricingMetaValue}>
                          {course.category || (course.badges && course.badges[0]) || 'Gen Ai'}
                        </span>
                      </div>
                    </div>

                    <div className={styles.pricingDividerRow}>
                      <span className={styles.pricingDividerLine} />
                      <span className={styles.pricingDividerText}>the next big thing +</span>
                      <span className={styles.pricingDividerLine} />
                    </div>

                    <div className={styles.pricingPerksList}>
                      <div className={styles.pricingPerkItem}>Personalized Guidance &amp; Doubt Solving</div>
                      <div className={styles.pricingPerkItem}>One Step Solution For Placement</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          course={course}
          student={student}
          onClose={() => setShowCheckout(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}
