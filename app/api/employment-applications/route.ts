import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const maxDuration = 90;

// GET: 취업지원 신청 목록 조회
export async function GET() {
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

    const { data, error } = await supabaseAdmin
      .from('employment_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching employment applications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch employment applications' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error reading employment applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employment applications' },
      { status: 500 }
    );
  }
}

// PATCH: 상태/메모 업데이트
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
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { error: 'At least one field is required for update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('employment_applications')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating employment application:', error);
      return NextResponse.json(
        { error: 'Failed to update employment application' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Employment application updated successfully',
      data,
    });
  } catch (error) {
    console.error('Error updating employment application:', error);
    return NextResponse.json(
      { error: 'Failed to update employment application' },
      { status: 500 }
    );
  }
}

// DELETE: 취업지원 신청 삭제
export async function DELETE(request: NextRequest) {
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
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs array is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('employment_applications')
      .delete()
      .in('id', ids)
      .select();

    if (error) {
      console.error('Error deleting employment applications:', error);
      return NextResponse.json(
        { error: 'Failed to delete employment applications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Employment applications deleted successfully',
      data,
    });
  } catch (error) {
    console.error('Error deleting employment applications:', error);
    return NextResponse.json(
      { error: 'Failed to delete employment applications' },
      { status: 500 }
    );
  }
}
