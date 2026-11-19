(function (global) {
  'use strict';

  // Sumber C dari modul, dipotong per operasi agar panel kode dapat menyorot
  // fungsi yang baru dijalankan. Baris `#define EOP_SIMBOL` berdiri sendiri
  // dengan tanda eop agar Task 5 dapat menggantinya sesuai EOP pengguna.
  global.Kode = {
    karakter: [
      {
        nama: 'mesinkarakter.h',
        blok: [
          { op: null, baris: ['#include <string.h>', ''] },
          { op: null, baris: ['// variabel global', 'extern int idx;', 'extern char cc;', ''] },
          { op: null, baris: ['// mulai dan akhir'] },
          { op: 'start', baris: ['void START(char pita[]);'] },
          { op: 'eop', baris: ['int EOP();', ''] },
          { op: null, baris: ['// memajukan pita'] },
          { op: 'inc', baris: ['void INC(char pita[]);'] },
          { op: 'adv', baris: ['void ADV(char pita[]);', ''] },
          { op: null, baris: ['// mengambil atribut'] },
          { op: 'getcc', baris: ['char GETCC();'] },
          { op: 'getidx', baris: ['int GETIdx();'] }
        ]
      },
      {
        nama: 'mesinkarakter.c',
        blok: [
          { op: null, baris: ['#include "mesinkarakter.h"', '', '// Simbol EOP dapat diganti dari antarmuka.'] },
          { op: null, eop: true, baris: ["#define EOP_SIMBOL '.'", ''] },
          { op: null, baris: ['int idx;', 'char cc;', ''] },
          {
            op: 'start',
            baris: [
              'void START(char pita[]){',
              '    idx = 0;',
              '    cc = pita[idx];',
              '}',
              ''
            ]
          },
          {
            op: 'eop',
            baris: [
              'int EOP(){',
              '    if(cc == EOP_SIMBOL){',
              '        return 1;',
              '    }',
              '    else{',
              '        return 0;',
              '    }',
              '}',
              ''
            ]
          },
          {
            op: 'inc',
            baris: [
              'void INC(char pita[]){',
              '    idx++;',
              '    cc = pita[idx];',
              '}',
              ''
            ]
          },
          {
            op: 'adv',
            baris: [
              'void ADV(char pita[]){',
              '    idx++;',
              '    cc = pita[idx];',
              '',
              "    while((cc == ' ') && (EOP() == 0)){",
              '        idx++;',
              '        cc = pita[idx];',
              '    }',
              '}',
              ''
            ]
          },
          {
            op: 'getcc',
            baris: [
              'char GETCC(){',
              '    return cc;',
              '}',
              ''
            ]
          },
          {
            op: 'getidx',
            baris: [
              'int GETIdx(){',
              '    return idx;',
              '}'
            ]
          }
        ]
      }
    ],
    kata: [
      {
        nama: 'mesinkata.h',
        blok: [
          { op: null, baris: ['#include <stdio.h>', '#include <string.h>', ''] },
          { op: null, baris: ['extern int idx;', 'extern int wlen;', 'extern char cw[51];', ''] },
          { op: 'start', baris: ['void start(char pita[]);'] },
          { op: 'reset', baris: ['void reset();'] },
          { op: 'inc', baris: ['void inc(char pita[]);'] },
          { op: 'eop', baris: ['int eop(char pita[]);'] },
          { op: 'getcw', baris: ['char* getcw();'] },
          { op: 'getlen', baris: ['int getlen();'] }
        ]
      },
      {
        nama: 'mesinkata.c',
        blok: [
          { op: null, baris: ['#include "mesinkata.h"', '', '// Simbol EOP dapat diganti dari antarmuka.'] },
          { op: null, eop: true, baris: ["#define EOP_SIMBOL '.'", ''] },
          { op: null, baris: ['int idx;', 'int wlen;', 'char cw[51];', ''] },
          {
            op: 'start',
            baris: [
              'void start(char pita[]){',
              '    idx = 0;',
              '    wlen = 0;',
              '',
              "    while (pita[idx] == ' '){",
              '        idx++;',
              '    }',
              '',
              "    while ((pita[idx] != ' ') && (eop(pita) == 0)){",
              '        cw[wlen] = pita[idx];',
              '        wlen++;',
              '        idx++;',
              '    }',
              "    cw[wlen] = '\\0';",
              '}',
              ''
            ]
          },
          {
            op: 'reset',
            baris: [
              'void reset(){',
              '    wlen = 0;',
              "    cw[wlen] = '\\0';",
              '}',
              ''
            ]
          },
          {
            op: 'eop',
            baris: [
              'int eop(char pita[]){',
              '    if(pita[idx] == EOP_SIMBOL){',
              '        return 1;',
              '    }',
              '    else{',
              '        return 0;',
              '    }',
              '}',
              ''
            ]
          },
          {
            op: 'inc',
            baris: [
              'void inc(char pita[]){',
              '    wlen = 0;',
              '',
              "    while (pita[idx] == ' '){",
              '        idx++;',
              '    }',
              '',
              "    while ((pita[idx] != ' ') && (eop(pita) == 0)){",
              '        cw[wlen] = pita[idx];',
              '        wlen++;',
              '        idx++;',
              '    }',
              "    cw[wlen] = '\\0';",
              '}',
              ''
            ]
          },
          {
            op: 'getcw',
            baris: [
              'char* getcw(){',
              '    return cw;',
              '}',
              ''
            ]
          },
          {
            op: 'getlen',
            baris: [
              'int getlen(){',
              '    return wlen;',
              '}'
            ]
          }
        ]
      }
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
