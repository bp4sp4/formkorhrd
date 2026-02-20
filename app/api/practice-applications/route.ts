import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Vercel Serverless 함수 타임아웃 설정 (초 단위)
export const maxDuration = 90;

// GET: 실습섭외신청서 목록 조회
export async function GET() {
  try {
    // 환경 변수 확인
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('practice_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching practice applications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch practice applications' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error reading practice applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch practice applications' },
      { status: 500 }
    );
  }
}

// POST: 실습섭외신청서 저장
export async function POST(request: NextRequest) {
  try {
    // 환경 변수 확인
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      student_name,
      gender,
      contact,
      birth_date,
      residence_area,
      address,
      practice_start_date,
      grade_report_date,
      preferred_semester,
      practice_type,
      preferred_days,
      has_car,
      cash_receipt_number,
      privacy_agreed,
      practice_place,
      click_source,
      is_manual_entry,
    } = body;

    // 유효성 검사 - 이름과 연락처만 필수
    if (!student_name || !contact) {
      return NextResponse.json(
        { error: 'Student name and contact are required' },
        { status: 400 }
      );
    }

    // Supabase에 데이터 저장
    const { data, error } = await supabaseAdmin
      .from('practice_applications')
      .insert([
        {
          student_name,
          gender: gender || null,
          contact,
          birth_date: birth_date || null,
          residence_area: residence_area || null,
          address: address || null,
          practice_start_date: practice_start_date || null,
          grade_report_date: grade_report_date || null,
          preferred_semester: preferred_semester || null,
          practice_type: practice_type || null,
          preferred_days: preferred_days || null,
          has_car: has_car || false,
          cash_receipt_number: cash_receipt_number || null,
          privacy_agreed: privacy_agreed || false,
          practice_place: practice_place || null,
          click_source: click_source || null,
          status: 'completed', // 기본 상태
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving practice application:', error);
      return NextResponse.json(
        { error: 'Failed to save practice application' },
        { status: 500 }
      );
    }

    // Slack 알림 전송
    if (process.env.SLACK_WEBHOOK_URL) {
      console.log('[SLACK] Slack 알림 전송 시도');
      try {
        const slackMessage = {
          text: is_manual_entry
            ? '🆕 *관리자가 새로운 실습섭외신청서를 추가했습니다*'
            : '📝 *새로운 실습섭외신청서가 접수되었습니다*',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: is_manual_entry
                  ? '🆕 관리자 추가 실습섭외신청서'
                  : '📝 새로운 실습섭외신청서',
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*이름:*\n${student_name}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*연락처:*\n${contact}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*주소:*\n${address || '미입력'}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*실습유형:*\n${practice_type || '미입력'}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*실습시작일:*\n${practice_start_date || '미입력'}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*선호요일:*\n${preferred_days || '미입력'}`,
                },
              ],
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `접수 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
                },
              ],
            },
          ],
        };

        const slackResponse = await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(slackMessage),
        });

        if (slackResponse.ok) {
          console.log('[SLACK] Slack 알림 전송 성공');
        } else {
          console.error('[SLACK] Slack 알림 전송 실패:', await slackResponse.text());
        }
      } catch (slackError) {
        console.error('[SLACK] Slack 알림 전송 중 오류:', slackError);
      }
    }

    return NextResponse.json(
      { message: 'Practice application submitted successfully', data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving practice application:', error);
    return NextResponse.json(
      { error: 'Failed to save practice application' },
      { status: 500 }
    );
  }
}

// PATCH: 실습섭외신청서 업데이트 (어드민 전용 - memo, status, payment_status, manager)
export async function PATCH(request: NextRequest) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { id, memo, status, payment_status, manager } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (memo !== undefined) updateData.memo = memo;
    if (status !== undefined) updateData.status = status;
    if (payment_status !== undefined) updateData.payment_status = payment_status;
    if (manager !== undefined) updateData.manager = manager || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'At least one field is required for update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('practice_applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating practice application:', error);
      return NextResponse.json(
        { error: 'Failed to update practice application' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Practice application updated successfully',
      data,
    });
  } catch (error) {
    console.error('Error updating practice application:', error);
    return NextResponse.json(
      { error: 'Failed to update practice application' },
      { status: 500 }
    );
  }
}

// DELETE: 실습섭외신청서 삭제
export async function DELETE(request: NextRequest) {
  try {
    // 환경 변수 확인
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs array is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('practice_applications')
      .delete()
      .in('id', ids)
      .select();

    if (error) {
      console.error('Error deleting practice applications:', error);
      return NextResponse.json(
        { error: 'Failed to delete practice applications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Practice applications deleted successfully',
      data,
    });
  } catch (error) {
    console.error('Error deleting practice applications:', error);
    return NextResponse.json(
      { error: 'Failed to delete practice applications' },
      { status: 500 }
    );
  }
}
